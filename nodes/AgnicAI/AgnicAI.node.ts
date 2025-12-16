import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
  NodeOperationError,
} from "n8n-workflow";

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
}

export class AgnicAI implements INodeType {
  description: INodeTypeDescription = {
    displayName: "AgnicAI",
    name: "agnicAI",
    group: ["transform"],
    version: 1.0,
    description:
      "Access various language models through AgnicPay AI Gateway with X402 payment support. Use this node in regular workflows to call AI models.",
    defaults: {
      name: "AgnicAI",
    },
    icon: "file:AgnicAI.png",
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
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
            description: "Simple and fast default option - GPT-4o Mini",
          },
          {
            name: "OpenAI - GPT-4o",
            value: "openai/gpt-4o",
            description: "OpenAI's latest GPT-4o model",
          },
          {
            name: "OpenAI - GPT-4o Mini",
            value: "openai/gpt-4o-mini",
            description: "Fast and efficient GPT-4o Mini",
          },
          {
            name: "OpenAI - GPT-4 Turbo",
            value: "openai/gpt-4-turbo",
            description: "GPT-4 Turbo with extended context",
          },
          {
            name: "OpenAI - GPT-4",
            value: "openai/gpt-4",
            description: "OpenAI GPT-4",
          },
          {
            name: "OpenAI - GPT-3.5 Turbo",
            value: "openai/gpt-3.5-turbo",
            description: "Fast GPT-3.5 Turbo model",
          },
          {
            name: "Anthropic - Claude 3.5 Sonnet",
            value: "anthropic/claude-3.5-sonnet",
            description: "Anthropic's Claude 3.5 Sonnet",
          },
          {
            name: "Anthropic - Claude 3 Opus",
            value: "anthropic/claude-3-opus",
            description: "Anthropic's Claude 3 Opus",
          },
          {
            name: "Anthropic - Claude 3 Sonnet",
            value: "anthropic/claude-3-sonnet",
            description: "Anthropic's Claude 3 Sonnet",
          },
          {
            name: "Anthropic - Claude 3 Haiku",
            value: "anthropic/claude-3-haiku",
            description: "Fast Claude 3 Haiku model",
          },
          {
            name: "Google - Gemini Pro 1.5",
            value: "google/gemini-pro-1.5",
            description: "Google Gemini Pro 1.5",
          },
          {
            name: "Google - Gemini Pro",
            value: "google/gemini-pro",
            description: "Google Gemini Pro",
          },
          {
            name: "Google - Gemini Flash 1.5",
            value: "google/gemini-flash-1.5",
            description: "Fast Gemini Flash 1.5",
          },
          {
            name: "Meta - Llama 3.1 405B",
            value: "meta-llama/llama-3.1-405b-instruct",
            description: "Meta Llama 3.1 405B Instruct",
          },
          {
            name: "Meta - Llama 3.1 70B",
            value: "meta-llama/llama-3.1-70b-instruct",
            description: "Meta Llama 3.1 70B Instruct",
          },
          {
            name: "Meta - Llama 3 70B",
            value: "meta-llama/llama-3-70b-instruct",
            description: "Meta Llama 3 70B Instruct",
          },
          {
            name: "Mistral AI - Mistral Large",
            value: "mistralai/mistral-large",
            description: "Mistral AI Large model",
          },
          {
            name: "Mistral AI - Mixtral 8x7B",
            value: "mistralai/mixtral-8x7b-instruct",
            description: "Mistral Mixtral 8x7B Instruct",
          },
          {
            name: "Mistral AI - Mistral 7B",
            value: "mistralai/mistral-7b-instruct",
            description: "Mistral 7B Instruct",
          },
          {
            name: "Cohere - Command R+",
            value: "cohere/command-r-plus",
            description: "Cohere Command R+",
          },
          {
            name: "Perplexity - Sonar",
            value: "perplexity/sonar",
            description: "Perplexity Sonar model",
          },
          {
            name: "xAI - Grok Beta",
            value: "x-ai/grok-beta",
            description: "xAI Grok Beta",
          },
        ],
        default: "openai/gpt-4o-mini",
        description:
          "Select a model or type any OpenRouter model ID. See https://openrouter.ai/models for all available models. Examples: 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-pro-1.5'",
      },
      {
        displayName: "Messages",
        name: "messages",
        type: "fixedCollection",
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: "message",
            displayName: "Message",
            values: [
              {
                displayName: "Role",
                name: "role",
                type: "options",
                options: [
                  {
                    name: "System",
                    value: "system",
                    description: "System message to set behavior",
                  },
                  {
                    name: "User",
                    value: "user",
                    description: "User message",
                  },
                  {
                    name: "Assistant",
                    value: "assistant",
                    description: "Assistant message (for conversation history)",
                  },
                ],
                default: "user",
                description: "The role of the message",
              },
              {
                displayName: "Content",
                name: "content",
                type: "string",
                default: "",
                typeOptions: {
                  rows: 4,
                },
                description: "The content of the message",
              },
            ],
          },
        ],
        description: "The messages to send to the model",
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
            description:
              "Controls randomness. Lower values make output more deterministic",
          },
          {
            displayName: "Max Tokens",
            name: "max_tokens",
            type: "number",
            typeOptions: {
              minValue: 1,
            },
            default: 2048,
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
            description:
              "Nucleus sampling: consider tokens with top_p probability mass",
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
            description:
              "Penalize tokens based on their frequency in the text so far",
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
            description:
              "Penalize tokens based on whether they appear in the text so far",
          },
        ],
        description: "Additional options for the chat completion",
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        // Get authentication type
        const authentication = this.getNodeParameter(
          "authentication",
          itemIndex,
        ) as string;

        // Get authentication header
        let authHeader: string;
        if (authentication === "oAuth2") {
          // OAuth2 authentication
          const credentials = (await this.getCredentials(
            "agnicWalletOAuth2Api",
            itemIndex,
          )) as any;
          authHeader = `Bearer ${String(credentials.oauthTokenData.access_token)}`;
        } else {
          // API Key authentication
          const credentials = await this.getCredentials(
            "agnicWalletApi",
            itemIndex,
          );
          const { apiToken } = credentials as { apiToken: string };
          authHeader = `Bearer ${String(apiToken)}`;
        }

        // Get model parameter (supports both dropdown selection and custom input)
        const modelParam = this.getNodeParameter("model", itemIndex) as string;
        const model = modelParam?.trim();

        if (!model || model === "") {
          throw new NodeOperationError(
            this.getNode(),
            "Model must be specified. Enter an OpenRouter model ID (e.g., 'openai/gpt-4o' or 'anthropic/claude-3.5-sonnet'). See https://openrouter.ai/models for all available models.",
            { itemIndex },
          );
        }

        // Get messages
        const messagesConfig = this.getNodeParameter(
          "messages",
          itemIndex,
          {},
        ) as any;

        if (!messagesConfig.message || messagesConfig.message.length === 0) {
          throw new NodeOperationError(
            this.getNode(),
            "At least one message is required",
            { itemIndex },
          );
        }

        const messages: ChatMessage[] = messagesConfig.message.map(
          (msg: any) => ({
            role: msg.role as "system" | "user" | "assistant",
            content: msg.content,
          }),
        );

        // Get options
        const options = this.getNodeParameter("options", itemIndex, {}) as any;

        // Build request body
        const requestBody: ChatCompletionsRequest = {
          model: model.trim(),
          messages,
        };

        if (options.temperature !== undefined) {
          requestBody.temperature = options.temperature;
        }
        if (options.max_tokens !== undefined) {
          requestBody.max_tokens = options.max_tokens;
        }
        if (options.top_p !== undefined) {
          requestBody.top_p = options.top_p;
        }
        if (options.frequency_penalty !== undefined) {
          requestBody.frequency_penalty = options.frequency_penalty;
        }
        if (options.presence_penalty !== undefined) {
          requestBody.presence_penalty = options.presence_penalty;
        }

        // Make request to AgnicPay AI Gateway
        const apiUrl = "https://api.agnicpay.xyz/v1/chat/completions";

        this.logger?.info(
          `[AgnicAI] Calling AgnicPay AI Gateway with model: ${model}`,
        );

        const response = await this.helpers.httpRequest({
          method: "POST",
          url: apiUrl,
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: requestBody,
          json: true,
        });

        // Format response
        const formattedResponse: any = {
          ...response,
          content: response.choices?.[0]?.message?.content || response.choices?.[0]?.text || response.content,
          role: response.choices?.[0]?.message?.role || "assistant",
        };

        returnData.push({
          json: formattedResponse,
          pairedItem: {
            item: itemIndex,
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        // Extract more detailed error information if available
        let detailedError = errorMessage;
        if (error && typeof error === "object" && "response" in error) {
          const responseError = error as any;
          if (responseError.response?.body) {
            detailedError = JSON.stringify(responseError.response.body);
          } else if (responseError.response?.statusCode) {
            detailedError = `HTTP ${responseError.response.statusCode}: ${errorMessage}`;
          }
        }

        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: detailedError,
            },
            pairedItem: {
              item: itemIndex,
            },
          });
          continue;
        }

        throw new NodeOperationError(this.getNode(), detailedError, {
          itemIndex,
        });
      }
    }

    return [returnData];
  }
}

