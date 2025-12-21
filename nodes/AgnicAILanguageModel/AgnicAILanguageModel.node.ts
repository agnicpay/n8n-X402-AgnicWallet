import {
  INodeType,
  INodeTypeDescription,
  ISupplyDataFunctions,
  ILoadOptionsFunctions,
  INodePropertyOptions,
  NodeConnectionTypes,
  NodeOperationError,
  SupplyData,
  jsonStringify,
} from "n8n-workflow";
import { ChatOpenAI } from "@langchain/openai";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { Serialized } from "@langchain/core/load/serializable";
import type { LLMResult } from "@langchain/core/outputs";

/**
 * Custom LLM Tracing callback for AgnicAI
 * This enables the spinning indicator and AI Agent logging
 * Mirrors n8n's internal N8nLlmTracing implementation
 */
class AgnicLlmTracing extends BaseCallbackHandler {
  name = "AgnicLlmTracing";

  // This flag makes LangChain wait for handlers before continuing
  awaitHandlers = true;

  private executionFunctions: ISupplyDataFunctions;
  private connectionType = NodeConnectionTypes.AiLanguageModel;
  private runsMap: Record<
    string,
    { index: number; options: any; messages: string[] }
  > = {};

  constructor(executionFunctions: ISupplyDataFunctions) {
    super();
    this.executionFunctions = executionFunctions;
  }

  async handleLLMStart(
    llm: Serialized,
    prompts: string[],
    runId: string,
  ): Promise<void> {
    const options = (llm as any).kwargs || llm;

    // Add input data to n8n's execution context
    // This triggers the spinning indicator
    const { index } = this.executionFunctions.addInputData(
      this.connectionType,
      [[{ json: { messages: prompts, options } }]],
    );

    this.runsMap[runId] = {
      index,
      options,
      messages: prompts,
    };

    // Log AI event for the AI Agent's log panel
    this.logAiEvent("ai-llm-generated-output-started", {
      messages: prompts,
      options,
    });
  }

  async handleLLMEnd(output: LLMResult, runId: string): Promise<void> {
    const runDetails = this.runsMap[runId] ?? { index: 0 };

    // Parse the response
    const generations = output.generations.map((gen) =>
      gen.map((g) => ({ text: g.text, generationInfo: g.generationInfo })),
    );

    const response = {
      generations,
      llmOutput: output.llmOutput,
    };

    // Add output data to n8n's execution context
    // This stops the spinning indicator and shows success
    this.executionFunctions.addOutputData(
      this.connectionType,
      runDetails.index,
      [[{ json: response }]],
    );

    // Log AI event for the AI Agent's log panel
    this.logAiEvent("ai-llm-generated-output", {
      messages: runDetails.messages,
      options: runDetails.options,
      response,
    });
  }

  async handleLLMError(error: Error, runId: string): Promise<void> {
    const runDetails = this.runsMap[runId] ?? { index: 0 };

    // Add error output
    this.executionFunctions.addOutputData(
      this.connectionType,
      runDetails.index,
      new NodeOperationError(this.executionFunctions.getNode(), error, {
        functionality: "configuration-node",
      }),
    );

    // Log AI error event
    this.logAiEvent("ai-llm-errored", {
      error: error.message || String(error),
      runId,
    });
  }

  private logAiEvent(event: string, data?: object): void {
    try {
      (this.executionFunctions as any).logAiEvent?.(
        event,
        data ? jsonStringify(data) : undefined,
      );
    } catch {
      // Silently ignore if logAiEvent is not available
    }
  }
}

/**
 * AgnicAI Chat Model Node for n8n
 *
 * Uses LangChain's ChatOpenAI class with AgnicPay's OpenAI-compatible endpoint.
 * This approach is identical to how n8n's built-in OpenAI Chat Model works,
 * just pointing to AgnicPay's AI Gateway instead.
 */
export class AgnicAILanguageModel implements INodeType {
  description: INodeTypeDescription = {
    displayName: "AgnicAI Chat Model",
    name: "lmChatAgnicAI",
    icon: "file:AgnicAILanguageModel.png",
    group: ["transform"],
    version: [1, 1.1],
    description:
      "Chat model using AgnicPay AI Gateway with X402 payment support",
    defaults: {
      name: "AgnicAI Chat Model",
    },
    codex: {
      categories: ["AI"],
      subcategories: {
        AI: ["Language Models", "Root Nodes"],
        "Language Models": ["Chat Models (Recommended)"],
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
    outputNames: ["Model"],
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
        default: "apiKey",
        description: "How to authenticate with AgnicWallet",
      },
      {
        displayName: "Model",
        name: "model",
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getModels",
          allowCustomValues: true,
        },
        default: "openai/gpt-4o-mini",
        description:
          "Select a model or type a custom model ID. Models are loaded dynamically from AgnicPay API.",
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
            default: 0.7,
            description:
              "Controls randomness: Lower = more focused and deterministic",
          },
          {
            displayName: "Max Tokens",
            name: "maxTokens",
            type: "number",
            typeOptions: {
              minValue: 1,
            },
            default: 2048,
            description: "Maximum number of tokens to generate",
          },
          {
            displayName: "Top P",
            name: "topP",
            type: "number",
            typeOptions: {
              minValue: 0,
              maxValue: 1,
              numberStepSize: 0.1,
            },
            default: 1,
            description:
              "Nucleus sampling: considers tokens with top_p probability mass",
          },
          {
            displayName: "Frequency Penalty",
            name: "frequencyPenalty",
            type: "number",
            typeOptions: {
              minValue: -2,
              maxValue: 2,
              numberStepSize: 0.1,
            },
            default: 0,
            description:
              "Penalizes new tokens based on frequency in text so far",
          },
          {
            displayName: "Presence Penalty",
            name: "presencePenalty",
            type: "number",
            typeOptions: {
              minValue: -2,
              maxValue: 2,
              numberStepSize: 0.1,
            },
            default: 0,
            description:
              "Penalizes new tokens based on presence in text so far",
          },
          {
            displayName: "Timeout",
            name: "timeout",
            type: "number",
            default: 60000,
            description: "Request timeout in milliseconds",
          },
        ],
      },
    ],
  };

  /**
   * Methods for dynamic option loading
   */
  methods = {
    loadOptions: {
      async getModels(
        this: ILoadOptionsFunctions,
      ): Promise<INodePropertyOptions[]> {
        // Curated fallback models if API fails
        const fallbackModels: INodePropertyOptions[] = [
          { name: "⭐ OpenAI: GPT-4o Mini (Recommended)", value: "openai/gpt-4o-mini" },
          { name: "⭐ Anthropic: Claude 3.5 Sonnet", value: "anthropic/claude-3.5-sonnet" },
          { name: "⭐ Google: Gemini 2.0 Flash", value: "google/gemini-2.0-flash-001" },
          { name: "⭐ Meta: Llama 3.3 70B", value: "meta-llama/llama-3.3-70b-instruct" },
          { name: "⭐ DeepSeek: Chat V3 (Affordable)", value: "deepseek/deepseek-chat" },
          { name: "[FREE] Meta: Llama 3.1 8B", value: "meta-llama/llama-3.1-8b-instruct:free" },
        ];

        try {
          const response = await this.helpers.httpRequest({
            method: "GET",
            url: "https://api.agnicpay.xyz/v1/models",
            timeout: 10000,
          });

          if (!response?.data || !Array.isArray(response.data) || response.data.length === 0) {
            return fallbackModels;
          }

          return response.data.map((model: { id: string; name?: string }) => ({
            name: model.name || model.id,
            value: model.id,
          }));
        } catch {
          // Return fallback models if API is unavailable
          return fallbackModels;
        }
      },
    },
  };

  async supplyData(
    this: ISupplyDataFunctions,
    itemIndex: number,
  ): Promise<SupplyData> {
    // Get authentication type and credentials
    const authentication = this.getNodeParameter(
      "authentication",
      itemIndex,
    ) as string;
    let apiKey: string;

    try {
      if (authentication === "oAuth2") {
        const credentials = (await this.getCredentials(
          "agnicWalletOAuth2Api",
          itemIndex,
        )) as any;
        apiKey = credentials.oauthTokenData?.access_token;
        if (!apiKey) {
          throw new Error(
            "OAuth2 access token not found. Please reconnect your AgnicWallet account.",
          );
        }
      } else {
        const credentials = await this.getCredentials(
          "agnicWalletApi",
          itemIndex,
        );
        apiKey = (credentials as { apiToken: string }).apiToken;
        if (!apiKey) {
          throw new Error(
            "API Key not found. Please configure your AgnicWallet API credentials.",
          );
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new NodeOperationError(
        this.getNode(),
        `Authentication failed: ${errorMsg}`,
        { itemIndex },
      );
    }

    // Get model parameter
    const model = this.getNodeParameter("model", itemIndex) as string;

    if (!model?.trim()) {
      throw new NodeOperationError(
        this.getNode(),
        "Model must be specified. Select from dropdown or enter a custom OpenRouter model ID.",
        { itemIndex },
      );
    }

    // Get options
    const options = this.getNodeParameter("options", itemIndex, {}) as {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      timeout?: number;
    };

    // Create ChatOpenAI instance pointing to AgnicPay's endpoint
    // Pass our custom tracing callback to enable spinning indicator and logging
    const chatModel = new ChatOpenAI({
      apiKey,
      model: model.trim(),
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      topP: options.topP,
      frequencyPenalty: options.frequencyPenalty,
      presencePenalty: options.presencePenalty,
      timeout: options.timeout ?? 60000,
      maxRetries: 2,
      configuration: {
        baseURL: "https://api.agnicpay.xyz/v1",
      },
      // Add our custom tracing callback for spinning indicator and AI Agent logging
      callbacks: [new AgnicLlmTracing(this)],
    });

    // Return in the same format as n8n's built-in OpenAI Chat Model
    return {
      response: chatModel,
    };
  }
}
