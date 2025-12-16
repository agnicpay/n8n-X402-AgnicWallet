declare module "@n8n/mcp-client" {
  export interface McpClientTransportConfig {
    type: "sse" | "stdio";
    url?: string;
    headers?: Record<string, string>;
    command?: string;
    args?: string[];
  }

  export interface McpClientConfig {
    transport: McpClientTransportConfig;
  }

  export class McpClient {
    constructor(config: McpClientConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    listTools(): Promise<{ tools: any[] }>;
    callTool(params: { name: string; arguments: any }): Promise<any>;
  }
}

