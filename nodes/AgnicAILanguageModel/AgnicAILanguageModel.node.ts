import {
  INodeType,
  INodeTypeDescription,
  ISupplyDataFunctions,
  NodeConnectionTypes,
  NodeOperationError,
  SupplyData,
} from "n8n-workflow";
import { BaseChatModel, BaseChatModelCallOptions } from "@langchain/core/language_models/chat_models";
import {
  BaseMessage,
  AIMessage,
  HumanMessage,
  SystemMessage,
  ChatMessage as LangChainChatMessage,
} from "@langchain/core/messages";
import {
  ChatGeneration,
  ChatResult,
} from "@langchain/core/outputs";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { StructuredToolInterface } from "@langchain/core/tools";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionsRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  tools?: any[];
}

/**
 * LangChain ChatModel implementation for AgnicPay AI Gateway
 * This properly implements the ChatModel interface so the Tools Agent can use it
 */
class AgnicChatModel extends BaseChatModel<BaseChatModelCallOptions> {
  // This property is checked by n8n's Tools Agent at graph construction time
  // It must be explicitly set to true for n8n to recognize tool calling support
  // Making it public (not readonly) in case n8n needs to check or modify it
  public supportsTools = true;

  // n8n internal markers to identify this as an n8n ChatModel
  // These help n8n's Tools Agent recognize it as a valid ChatModel
  public readonly __n8nType = 'chatModel' as const;
  public readonly __n8nChatModel = true;

  private apiUrl: string;
  private authHeader: string;
  private model: string;
  private temperature?: number;
  private maxTokens?: number;
  private topP?: number;
  private frequencyPenalty?: number;
  private presencePenalty?: number;
  private tools?: StructuredToolInterface[];

  constructor(config: {
    apiUrl: string;
    authHeader: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    httpRequest: any;
    logger?: any;
  }) {
    super({});
    this.apiUrl = config.apiUrl;
    this.authHeader = config.authHeader;
    this.model = config.model;
    this.temperature = config.temperature;
    this.maxTokens = config.maxTokens;
    this.topP = config.topP;
    this.frequencyPenalty = config.frequencyPenalty;
    this.presencePenalty = config.presencePenalty;
    // Store httpRequest helper and logger
    (this as any)._httpRequest = config.httpRequest;
    (this as any)._logger = config.logger;
    
    // Add n8n Symbol marker after construction
    // This is what n8n might check to identify ChatModels
    (this as any)[Symbol.for('n8n.chatModel')] = true;
  }

  _llmType(): string {
    return "agnic-ai";
  }

  /**
   * Convert LangChain messages to OpenAI format
   */
  private convertMessagesToOpenAIFormat(messages: BaseMessage[]): ChatMessage[] {
    return messages.map((msg) => {
      if (msg instanceof HumanMessage) {
        return {
          role: "user" as const,
          content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
        };
      } else if (msg instanceof AIMessage) {
        return {
          role: "assistant" as const,
          content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
        };
      } else if (msg instanceof SystemMessage) {
        return {
          role: "system" as const,
          content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
        };
      } else if (msg instanceof LangChainChatMessage) {
        return {
          role: (msg.role || "user") as "system" | "user" | "assistant",
          content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
        };
      } else {
        // Fallback for unknown message types
        return {
          role: "user" as const,
          content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
        };
      }
    });
  }

  /**
   * Convert OpenAI tool format to LangChain format if needed
   */
  private convertToolsToOpenAIFormat(): any[] | undefined {
    if (!this.tools || this.tools.length === 0) {
      return undefined;
    }

    return this.tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.schema || {},
      },
    }));
  }

  /**
   * Main generation method - called by LangChain
   */
  async _generate(
    messages: BaseMessage[],
    _options?: this["ParsedCallOptions"],
    _runManager?: CallbackManagerForLLMRun,
  ): Promise<ChatResult> {
    const httpRequest = (this as any)._httpRequest;
    const logger = (this as any)._logger;

    if (!httpRequest) {
      throw new Error("HTTP request helper not available");
    }

    logger?.info(`[AgnicChatModel] _generate called with ${messages.length} messages`);

    // Convert LangChain messages to OpenAI format
    const openAIMessages = this.convertMessagesToOpenAIFormat(messages);
    logger?.info(`[AgnicChatModel] Converted to ${openAIMessages.length} OpenAI messages`);

    // Build request body
    const requestBody: ChatCompletionsRequest = {
      model: this.model,
      messages: openAIMessages,
    };

    // Add parameters if set
    if (this.temperature !== undefined) {
      requestBody.temperature = this.temperature;
    }
    if (this.maxTokens !== undefined) {
      requestBody.max_tokens = this.maxTokens;
    }
    if (this.topP !== undefined) {
      requestBody.top_p = this.topP;
    }
    if (this.frequencyPenalty !== undefined) {
      requestBody.frequency_penalty = this.frequencyPenalty;
    }
    if (this.presencePenalty !== undefined) {
      requestBody.presence_penalty = this.presencePenalty;
    }

    // Add tools if bound
    const tools = this.convertToolsToOpenAIFormat();
    if (tools && tools.length > 0) {
      requestBody.tools = tools;
      logger?.info(`[AgnicChatModel] Added ${tools.length} tools to request`);
    }

    logger?.info(`[AgnicChatModel] Calling AgnicPay AI Gateway: ${this.apiUrl}`);
    logger?.info(`[AgnicChatModel] Model: ${this.model}`);
    logger?.info(`[AgnicChatModel] Request body (preview): ${JSON.stringify(requestBody).substring(0, 500)}`);

    try {
      const response = await httpRequest({
        method: "POST",
        url: this.apiUrl,
        headers: {
          "Content-Type": "application/json",
          Authorization: this.authHeader,
        },
        body: requestBody,
        json: true,
      });

      logger?.info(`[AgnicChatModel] API request successful`);
      logger?.info(`[AgnicChatModel] Response has choices: ${!!response.choices}, count: ${response.choices?.length || 0}`);

      // Extract the message from response
      const choice = response.choices?.[0];
      if (!choice || !choice.message) {
        throw new Error("Invalid response from AgnicPay AI Gateway: no message in response");
      }

      const message = choice.message;
      const content = message.content || "";
      const toolCalls = message.tool_calls;

      logger?.info(`[AgnicChatModel] Message has tool_calls: ${!!toolCalls}, count: ${toolCalls?.length || 0}`);

      // Create AIMessage with content and optional tool_calls
      const aiMessage = new AIMessage({
        content,
        tool_calls: toolCalls,
        response_metadata: {
          model: response.model || this.model,
          finish_reason: choice.finish_reason,
          usage: response.usage,
        },
      });

      // Return ChatResult with the generation
      const generation: ChatGeneration = {
        message: aiMessage,
        text: content,
      };

      return {
        generations: [generation],
        llmOutput: {
          model: response.model || this.model,
          usage: response.usage,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      logger?.error(`[AgnicChatModel] API request failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Bind tools to the model - required for tool calling support
   * LangChain expects immutability, so we return a new instance with tools bound
   * This is important for multi-run agents
   */
  bindTools(tools: StructuredToolInterface[]): this {
    const logger = (this as any)._logger;
    logger?.info(`[AgnicChatModel] bindTools called with ${tools?.length || 0} tools`);
    
    // Return a new instance (immutable pattern as expected by LangChain)
    const cloned = Object.create(Object.getPrototypeOf(this));
    Object.assign(cloned, this);
    cloned.tools = tools;
    cloned.supportsTools = true; // Preserve the supportsTools property
    cloned.__n8nType = 'chatModel'; // Preserve n8n markers
    cloned.__n8nChatModel = true;
    return cloned;
  }
}

export class AgnicAILanguageModel implements INodeType {
  description: INodeTypeDescription = {
    displayName: "AgnicAI Chat Model",
    name: "lmChatAgnicAI",
    group: ["transform"],
    version: 1.7,
    description:
      "Access various language models through AgnicPay AI Gateway with X402 payment support. Can be used as a Chat Model in AI Agent nodes including Tools Agent. Messages are provided by the AI Agent node.",
    defaults: {
      name: "AgnicAI Chat Model",
    },
    icon: "file:AgnicAILanguageModel.png",
    codex: {
      categories: ["AI"],
      subcategories: {
        chatModels: ["tools"],
      },
      resources: {
        primaryDocumentation: [
          {
            url: "https://www.agnicpay.xyz/ai-gateway",
          },
        ],
      },
    },
    inputs: [],
    outputs: [NodeConnectionTypes.AiLanguageModel],
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
        default: "oAuth2",
        description: "How to authenticate with AgnicWallet",
      },
      {
        displayName: "Model",
        name: "model",
        type: "options",
        typeOptions: {
          allowCustomValues: true,
        },
        options: [
          {
            name: "Simple (GPT-4o Mini)",
            value: "openai/gpt-4o-mini",
            description: "Fast and cost-effective",
          },
          {
            name: "GPT-4o",
            value: "openai/gpt-4o",
          },
          {
            name: "GPT-4 Turbo",
            value: "openai/gpt-4-turbo",
          },
          {
            name: "GPT-3.5 Turbo",
            value: "openai/gpt-3.5-turbo",
          },
          {
            name: "Claude 3.5 Sonnet",
            value: "anthropic/claude-3.5-sonnet",
          },
          {
            name: "Claude 3 Opus",
            value: "anthropic/claude-3-opus",
          },
          {
            name: "Claude 3 Haiku",
            value: "anthropic/claude-3-haiku",
          },
          {
            name: "Gemini Pro 1.5",
            value: "google/gemini-pro-1.5",
          },
          {
            name: "Gemini Flash 1.5",
            value: "google/gemini-flash-1.5",
          },
          {
            name: "Llama 3.1 70B",
            value: "meta-llama/llama-3.1-70b-instruct",
          },
          {
            name: "Llama 3.1 8B",
            value: "meta-llama/llama-3.1-8b-instruct",
          },
          {
            name: "Mistral Large",
            value: "mistralai/mistral-large",
          },
          {
            name: "Mistral Medium",
            value: "mistralai/mistral-medium",
          },
          {
            name: "Mixtral 8x7B",
            value: "mistralai/mixtral-8x7b-instruct",
          },
          {
            name: "Mixtral 8x22B",
            value: "mistralai/mixtral-8x22b-instruct",
          },
          {
            name: "Pi 4",
            value: "inflection/inflection-2.5",
          },
          {
            name: "Qwen 2.5 72B",
            value: "qwen/qwen-2.5-72b-instruct",
          },
          {
            name: "DeepSeek R1",
            value: "deepseek/deepseek-r1",
          },
          {
            name: "DeepSeek Chat",
            value: "deepseek/deepseek-chat",
          },
          {
            name: "Yi 1.5 34B",
            value: "01-ai/yi-1.5-34b-chat",
          },
        ],
        default: "openai/gpt-4o-mini",
        description:
          "Select a model from OpenRouter. You can also type a custom model ID. See https://openrouter.ai/models for all available models.",
      },
      {
        displayName: "Options",
        name: "options",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        options: [
          {
            displayName: "Temperature",
            name: "temperature",
            type: "number",
            typeOptions: {
              minValue: 0,
              maxValue: 2,
              numberStepSize: 0.1,
            },
            default: 1,
            description: "Controls randomness: Lower = more focused and deterministic",
          },
          {
            displayName: "Max Tokens",
            name: "max_tokens",
            type: "number",
            typeOptions: {
              minValue: 1,
            },
            default: 1024,
            description: "Maximum number of tokens to generate",
          },
          {
            displayName: "Top P",
            name: "top_p",
            type: "number",
            typeOptions: {
              minValue: 0,
              maxValue: 1,
              numberStepSize: 0.1,
            },
            default: 1,
            description: "Nucleus sampling: considers tokens with top_p probability mass",
          },
          {
            displayName: "Frequency Penalty",
            name: "frequency_penalty",
            type: "number",
            typeOptions: {
              minValue: -2,
              maxValue: 2,
              numberStepSize: 0.1,
            },
            default: 0,
            description: "Penalizes new tokens based on their frequency in the text so far",
          },
          {
            displayName: "Presence Penalty",
            name: "presence_penalty",
            type: "number",
            typeOptions: {
              minValue: -2,
              maxValue: 2,
              numberStepSize: 0.1,
            },
            default: 0,
            description: "Penalizes new tokens based on whether they appear in the text so far",
          },
        ],
      },
    ],
  };

  async supplyData(
    this: ISupplyDataFunctions,
    itemIndex: number,
  ): Promise<SupplyData> {
    this.logger?.info(`[AgnicAI] supplyData called for itemIndex: ${itemIndex}`);

    // Get authentication
    const authentication = this.getNodeParameter("authentication", itemIndex) as string;
    let authHeader: string;

    try {
      if (authentication === "oAuth2") {
        this.logger?.info(`[AgnicAI] Authentication type: oAuth2`);
        this.logger?.info(`[AgnicAI] Getting OAuth2 credentials...`);
        const credentials = (await this.getCredentials(
          "agnicWalletOAuth2Api",
          itemIndex,
        )) as any;
        authHeader = `Bearer ${credentials.oauthTokenData.access_token}`;
        this.logger?.info(`[AgnicAI] OAuth2 token obtained`);
      } else {
        this.logger?.info(`[AgnicAI] Authentication type: apiKey`);
        this.logger?.info(`[AgnicAI] Getting API Key credentials...`);
        const credentials = await this.getCredentials(
          "agnicWalletApi",
          itemIndex,
        );
        const { apiToken } = credentials as { apiToken: string };
        authHeader = `Bearer ${String(apiToken)}`;
        this.logger?.info(`[AgnicAI] API Key obtained (length: ${authHeader.length})`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger?.error(`[AgnicAI] Failed to get credentials: ${errorMsg}`);
      throw new NodeOperationError(
        this.getNode(),
        `Failed to get credentials: ${errorMsg}`,
        { itemIndex },
      );
    }

    // Get model parameter
    const modelParam = this.getNodeParameter("model", itemIndex) as string;
    const model = modelParam?.trim();

    this.logger?.info(`[AgnicAI] Model parameter: "${modelParam}" -> "${model}"`);

    if (!model || model === "") {
      throw new NodeOperationError(
        this.getNode(),
        "Model must be specified. Enter an OpenRouter model ID (e.g., 'openai/gpt-4o' or 'anthropic/claude-3.5-sonnet'). See https://openrouter.ai/models for all available models.",
        { itemIndex },
      );
    }

    // Get options
    const options = this.getNodeParameter("options", itemIndex, {}) as any;

    // Create the ChatModel instance
    const chatModel = new AgnicChatModel({
      apiUrl: "https://api.agnicpay.xyz/v1/chat/completions",
      authHeader,
      model: model.trim(),
      temperature: options.temperature,
      maxTokens: options.max_tokens,
      topP: options.top_p,
      frequencyPenalty: options.frequency_penalty,
      presencePenalty: options.presence_penalty,
      httpRequest: this.helpers.httpRequest.bind(this.helpers),
      logger: this.logger,
    });

    this.logger?.info(`[AgnicAI] Created AgnicChatModel instance for model: ${model}`);
    this.logger?.info(`[AgnicAI] Node declared as tools-capable chat model via codex.subcategories.chatModels`);
    this.logger?.info(`[AgnicAI] ChatModel instance has supportsTools: ${chatModel.supportsTools}`);

    // Return the ChatModel instance as ai_languageModel property
    // n8n expects this format to properly integrate with the AI Agent
    // The Tools Agent checks if this supports tool calling via bindTools()
    return {
      ai_languageModel: chatModel,
    } as any as SupplyData;
  }
}
