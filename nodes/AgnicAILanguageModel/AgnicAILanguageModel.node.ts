import {
  INodeType,
  INodeTypeDescription,
  ISupplyDataFunctions,
  NodeConnectionTypes,
  NodeOperationError,
  SupplyData,
} from "n8n-workflow";
import { ChatOpenAI } from "@langchain/openai";

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
    description: "Chat model using AgnicPay AI Gateway with X402 payment support",
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
          allowCustomValues: true,
        },
        options: [
          {
            name: "GPT-4o Mini (Fast & Affordable)",
            value: "openai/gpt-4o-mini",
          },
          {
            name: "GPT-4o (Best Quality)",
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
            name: "Mixtral 8x22B",
            value: "mistralai/mixtral-8x22b-instruct",
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
            name: "Qwen 2.5 72B",
            value: "qwen/qwen-2.5-72b-instruct",
          },
        ],
        default: "openai/gpt-4o-mini",
        description:
          "Select a model or type a custom OpenRouter model ID. See https://openrouter.ai/models for all available models.",
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
            description: "Controls randomness: Lower = more focused and deterministic",
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
            description: "Nucleus sampling: considers tokens with top_p probability mass",
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
            description: "Penalizes new tokens based on frequency in text so far",
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
            description: "Penalizes new tokens based on presence in text so far",
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

  async supplyData(
    this: ISupplyDataFunctions,
    itemIndex: number,
  ): Promise<SupplyData> {
    this.logger?.info(`[AgnicAI] supplyData called for itemIndex: ${itemIndex}`);

    // Get authentication type and credentials
    const authentication = this.getNodeParameter("authentication", itemIndex) as string;
    let apiKey: string;

    try {
      if (authentication === "oAuth2") {
        this.logger?.info(`[AgnicAI] Using OAuth2 authentication`);
        const credentials = (await this.getCredentials(
          "agnicWalletOAuth2Api",
          itemIndex,
        )) as any;
        apiKey = credentials.oauthTokenData?.access_token;
        if (!apiKey) {
          throw new Error("OAuth2 access token not found. Please reconnect your AgnicWallet account.");
        }
      } else {
        this.logger?.info(`[AgnicAI] Using API Key authentication`);
        const credentials = await this.getCredentials("agnicWalletApi", itemIndex);
        apiKey = (credentials as { apiToken: string }).apiToken;
        if (!apiKey) {
          throw new Error("API Key not found. Please configure your AgnicWallet API credentials.");
        }
      }
      this.logger?.info(`[AgnicAI] Credentials obtained successfully`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger?.error(`[AgnicAI] Credential error: ${errorMsg}`);
      throw new NodeOperationError(
        this.getNode(),
        `Authentication failed: ${errorMsg}`,
        { itemIndex },
      );
    }

    // Get model parameter
    const model = this.getNodeParameter("model", itemIndex) as string;
    this.logger?.info(`[AgnicAI] Model: ${model}`);

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
    // This is the same approach n8n's built-in OpenAI Chat Model uses
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
    });

    this.logger?.info(`[AgnicAI] Created ChatOpenAI instance with AgnicPay baseURL`);
    this.logger?.info(`[AgnicAI] Model: ${model}, BaseURL: https://api.agnicpay.xyz/v1`);

    // Return in the same format as n8n's built-in OpenAI Chat Model
    // This is the critical part - n8n expects { response: model }
    return {
      response: chatModel,
    };
  }
}
