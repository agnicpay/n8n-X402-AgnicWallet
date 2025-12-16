import {
  INodeType,
  INodeTypeDescription,
  ISupplyDataFunctions,
  IExecuteFunctions,
  SupplyData,
  NodeConnectionTypes,
  NodeOperationError,
  INodeExecutionData,
} from "n8n-workflow";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { Toolkit } from "langchain/agents";
import { z } from "zod";
import { jsonSchemaToZod } from "@n8n/json-schema-to-zod";
import type { Tool as McpToolType } from "@modelcontextprotocol/sdk/types.js";

/**
 * Toolkit class that wraps MCP tools for n8n AI Agent
 * Extends Toolkit from langchain/agents for proper serialization
 */
class AgnicMcpToolkit extends Toolkit {
  constructor(public tools: DynamicStructuredTool[]) {
    super();
  }
}

// Pre-configured AgnicPay MCP endpoint (uses HTTP Streamable transport)
const AGNIC_MCP_ENDPOINT = "https://mcp.agnicpay.xyz/sse";

/**
 * Convert JSON Schema to Zod schema using n8n's library
 * Returns actual Zod schema objects (not strings)
 */
function convertJsonSchemaToZod(schema: unknown): z.ZodTypeAny {
  if (!schema || typeof schema !== "object") {
    return z.object({});
  }

  try {
    // @n8n/json-schema-to-zod returns actual Zod objects, not strings
    const zodSchema = jsonSchemaToZod(schema);

    // Ensure we return an object schema for structured tools
    if (zodSchema instanceof z.ZodObject) {
      return zodSchema;
    }

    // Wrap non-object schemas in an object
    return z.object({ value: zodSchema });
  } catch {
    // Fallback to empty object schema if conversion fails
    return z.object({});
  }
}

/**
 * Convert an MCP tool to a LangChain DynamicStructuredTool
 */
function mcpToolToDynamicTool(
  tool: McpToolType,
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>
): DynamicStructuredTool {
  // Convert JSON Schema to Zod schema using proper library
  const zodSchema = convertJsonSchemaToZod(tool.inputSchema);

  // Use type assertion to avoid deep type instantiation issues with DynamicStructuredTool
  const toolConfig = {
    name: tool.name,
    description: tool.description || `MCP tool: ${tool.name}`,
    schema: zodSchema,
    func: async (input: Record<string, unknown>): Promise<string> => {
      try {
        const result = await callTool(tool.name, input);
        if (typeof result === "string") {
          return result;
        }
        return JSON.stringify(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return `Error calling ${tool.name}: ${errorMessage}`;
      }
    },
    // Required metadata for proper tool serialization in n8n
    metadata: { isFromToolkit: true },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new DynamicStructuredTool(toolConfig as any);
}

/**
 * AgnicMCPTool - MCP Client for AgnicPay
 *
 * This is a supply-only AI tool node that connects to the AgnicPay MCP server
 * and provides X402 payment tools to AI Agents via the MCP protocol.
 *
 * This node cannot be executed directly - it only supplies tools to AI Agents.
 */
export class AgnicMCPTool implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Agnic MCP Tool",
    name: "agnicMcpTool",
    icon: "file:AgnicMCPTool.png",
    group: ["output"],
    version: 1,
    description: "MCP client for AgnicPay - X402 payment tools for AI Agents",
    defaults: {
      name: "Agnic MCP Tool",
    },

    // Supply-only AI tool configuration
    inputs: [],
    outputs: [{ type: NodeConnectionTypes.AiTool, displayName: "Tools" }],

    codex: {
      categories: ["AI"],
      subcategories: {
        AI: ["Tools"],
      },
      resources: {
        primaryDocumentation: [
          {
            url: "https://www.agnicpay.xyz/mcp",
          },
        ],
      },
    },

    credentials: [
      {
        name: "agnicWalletOAuth2Api",
        required: false,
        displayOptions: {
          show: {
            authentication: ["oAuth2"],
          },
        },
      },
      {
        name: "agnicWalletApi",
        required: false,
        displayOptions: {
          show: {
            authentication: ["apiKey"],
          },
        },
      },
    ],

    properties: [
      {
        displayName: "Authentication",
        name: "authentication",
        type: "options",
        default: "apiKey",
        options: [
          {
            name: "OAuth2",
            value: "oAuth2",
            description: "Recommended: Connect your account",
          },
          {
            name: "API Key",
            value: "apiKey",
            description: "For CI/CD or programmatic access",
          },
        ],
        description: "How to authenticate with AgnicWallet",
      },
      {
        displayName:
          "Connects to AgnicPay MCP server. Tools are discovered automatically and include: make X402 API requests, check balance, view payment history, and discover APIs.",
        name: "notice",
        type: "notice",
        default: "",
      },
    ],
  };

  /**
   * Execute method for direct tool invocation.
   * This is called when input data is passed directly to this node.
   */
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const node = this.getNode();
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Get authentication
    const authentication = this.getNodeParameter("authentication", 0) as "oAuth2" | "apiKey";
    let accessToken: string | undefined;

    try {
      if (authentication === "oAuth2") {
        const creds = (await this.getCredentials("agnicWalletOAuth2Api")) as {
          oauthTokenData?: { access_token?: string };
        };
        accessToken = creds?.oauthTokenData?.access_token;
      } else {
        const creds = (await this.getCredentials("agnicWalletApi")) as { apiToken: string };
        accessToken = creds?.apiToken;
      }
    } catch {
      throw new NodeOperationError(node, "Failed to load AgnicWallet credentials.");
    }

    if (!accessToken) {
      throw new NodeOperationError(node, "Missing AgnicWallet authentication token.");
    }

    // Connect to MCP server
    const transport = new StreamableHTTPClientTransport(new URL(AGNIC_MCP_ENDPOINT), {
      requestInit: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const client = new Client({ name: "agnic-mcp-client", version: "1.0.0" }, { capabilities: {} });

    try {
      await client.connect(transport);
      const toolsResult = await client.listTools();
      const mcpTools = toolsResult.tools || [];

      for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
        const item = items[itemIndex];

        // Expect input to have a 'tool' property with the tool name
        if (!item.json.tool || typeof item.json.tool !== "string") {
          throw new NodeOperationError(node, "Tool name not found in item.json.tool", { itemIndex });
        }

        const toolName = item.json.tool as string;
        const matchingTool = mcpTools.find((t) => t.name === toolName);

        if (!matchingTool) {
          throw new NodeOperationError(node, `Tool "${toolName}" not found`, { itemIndex });
        }

        // Extract tool arguments (everything except 'tool' property)
        const { tool: _, ...toolArguments } = item.json;

        const result = await client.callTool({ name: toolName, arguments: toolArguments });

        // Extract text content from result
        let responseContent: unknown = result;
        if (result.content && Array.isArray(result.content)) {
          const textContent = result.content.find((c: { type: string }) => c.type === "text");
          if (textContent && "text" in textContent) {
            responseContent = textContent.text;
          }
        }

        returnData.push({
          json: { response: responseContent as string },
          pairedItem: { item: itemIndex },
        });
      }
    } finally {
      try {
        await client.close();
      } catch {
        // Ignore cleanup errors
      }
      try {
        await transport.close();
      } catch {
        // Ignore cleanup errors
      }
    }

    return [returnData];
  }

  /**
   * Supply MCP tools to AI Agent.
   * This is the main method that provides tools to the AI Agent.
   */
  async supplyData(
    this: ISupplyDataFunctions,
    itemIndex: number
  ): Promise<SupplyData> {
    // ─────────────────────────────────────────────
    // Authentication
    // ─────────────────────────────────────────────
    const authentication = this.getNodeParameter(
      "authentication",
      itemIndex
    ) as "oAuth2" | "apiKey";

    let accessToken: string | undefined;

    try {
      if (authentication === "oAuth2") {
        const creds = (await this.getCredentials(
          "agnicWalletOAuth2Api",
          itemIndex
        )) as { oauthTokenData?: { access_token?: string } };

        accessToken = creds?.oauthTokenData?.access_token;
      } else {
        const creds = (await this.getCredentials(
          "agnicWalletApi",
          itemIndex
        )) as { apiToken: string };

        accessToken = creds?.apiToken;
      }
    } catch (err) {
      throw new NodeOperationError(
        this.getNode(),
        "Failed to load AgnicWallet credentials. Please configure your credentials.",
        { itemIndex }
      );
    }

    if (!accessToken) {
      throw new NodeOperationError(
        this.getNode(),
        "Missing AgnicWallet authentication token. Please check your credentials configuration.",
        { itemIndex }
      );
    }

    // ─────────────────────────────────────────────
    // MCP Client Setup
    // ─────────────────────────────────────────────
    let client: Client | undefined;
    let transport: StreamableHTTPClientTransport | undefined;

    try {
      // Create HTTP Streamable transport with authentication
      // This transport uses POST requests and accepts both JSON and SSE responses
      transport = new StreamableHTTPClientTransport(
        new URL(AGNIC_MCP_ENDPOINT),
        {
          requestInit: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      );

      // Create MCP client
      client = new Client(
        { name: "agnic-mcp-client", version: "1.0.0" },
        { capabilities: {} }
      );

      // Connect to MCP server
      await client.connect(transport);

      // ─────────────────────────────────────────────
      // Discover and wrap MCP tools
      // ─────────────────────────────────────────────
      const toolsResult = await client.listTools();
      const mcpTools = toolsResult.tools || [];

      if (mcpTools.length === 0) {
        throw new NodeOperationError(
          this.getNode(),
          "No tools available from AgnicPay MCP server. Please check your authentication and try again.",
          { itemIndex }
        );
      }

      // Create a tool caller function
      const callTool = async (
        name: string,
        args: Record<string, unknown>
      ): Promise<unknown> => {
        if (!client) {
          throw new Error("MCP client is not connected");
        }

        const result = await client.callTool({
          name,
          arguments: args,
        });

        // Extract content from the result
        if (result.content && Array.isArray(result.content)) {
          const textContent = result.content.find(
            (c: { type: string }) => c.type === "text"
          );
          if (textContent && "text" in textContent) {
            return textContent.text;
          }
        }

        return result;
      };

      // Convert MCP tools to LangChain DynamicStructuredTools
      const langchainTools = mcpTools.map((tool) =>
        mcpToolToDynamicTool(tool, callTool)
      );

      // Wrap tools in a Toolkit for n8n AI Agent compatibility
      const toolkit = new AgnicMcpToolkit(langchainTools);

      // Store references for cleanup
      const clientRef = client;
      const transportRef = transport;

      // Return toolkit with cleanup function
      return {
        response: toolkit,
        closeFunction: async () => {
          try {
            await clientRef.close();
          } catch {
            // Ignore cleanup errors
          }
          try {
            await transportRef.close();
          } catch {
            // Ignore cleanup errors
          }
        },
      };
    } catch (error) {
      // Clean up on error
      if (client) {
        try {
          await client.close();
        } catch {
          // Ignore cleanup errors
        }
      }
      if (transport) {
        try {
          await transport.close();
        } catch {
          // Ignore cleanup errors
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      throw new NodeOperationError(
        this.getNode(),
        `Failed to connect to AgnicPay MCP server: ${errorMessage}`,
        { itemIndex }
      );
    }
  }
}
