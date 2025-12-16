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

import { McpClient } from "@n8n/mcp-client";
import { McpTool } from "@n8n/langchain-mcp-tool";

// Pre-configured AgnicPay MCP endpoint
const AGNIC_MCP_SSE_ENDPOINT = "https://mcp.agnicpay.xyz/sse";

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
    // Use 'ai' group to signal this is a pure AI tool, not a routable node
    // Cast needed because TypeScript types may be outdated
    group: ["ai"] as unknown as INodeTypeDescription["group"],
    version: 1,
    description: "MCP client for AgnicPay - X402 payment tools for AI Agents",
    defaults: {
      name: "Agnic MCP Tool",
    },

    // Supply-only AI tool configuration
    inputs: [],
    outputs: [NodeConnectionTypes.AiTool],
    outputNames: ["Tool"],
    usableAsTool: true,
    // Prevent routing execution - this is a supply-only node
    // @ts-ignore - executeOnce may not be in types but is recognized by n8n runtime
    executeOnce: true,

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
   * Dummy execute method to prevent RoutingNode fallback.
   * This node is supply-only and cannot be executed directly.
   */
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    throw new NodeOperationError(
      this.getNode(),
      "Agnic MCP Tool is a supply-only AI Agent tool and cannot be executed directly. " +
      "Connect it to an AI Agent node to use its tools."
    );
  }

  /**
   * Supply MCP tools to AI Agent.
   * This is the only method that should be called for this node.
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
        )) as any;

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
    // MCP Client
    // ─────────────────────────────────────────────
    const mcpClient = new McpClient({
      transport: {
        type: "sse",
        url: AGNIC_MCP_SSE_ENDPOINT,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    // Connect to MCP server
    await mcpClient.connect();

    // ─────────────────────────────────────────────
    // Wrap MCP tools for AI Agent
    // ─────────────────────────────────────────────
    const mcpTool = new McpTool({
      client: mcpClient,
      name: "agnic_mcp",
      description:
        "AgnicPay MCP tools: make X402 API requests with automatic payments, check USDC balance, view payment history, discover X402 APIs, and send USDC.",
    });

    return {
      response: mcpTool,
    };
  }
}
