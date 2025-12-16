declare module "@n8n/langchain-mcp-tool" {
  import { McpClient } from "@n8n/mcp-client";

  export interface McpToolConfig {
    client: McpClient;
    name: string;
    description: string;
  }

  /**
   * McpTool wraps an MCP client for use with LangChain/AI Agents
   * This is n8n's native MCP tool wrapper
   */
  export class McpTool {
    constructor(config: McpToolConfig);
    name: string;
    description: string;
  }
}

