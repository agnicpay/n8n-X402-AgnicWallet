import {
  INodeType,
  INodeTypeDescription,
  ISupplyDataFunctions,
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
          allowCustomValues: true,
        },
        options: [
          // ===== RECOMMENDED MODELS =====
          {
            name: "⭐ OpenAI: GPT-4o Mini (Recommended)",
            value: "openai/gpt-4o-mini",
          },
          {
            name: "⭐ Anthropic: Claude 3.5 Sonnet (Recommended)",
            value: "anthropic/claude-3.5-sonnet",
          },
          {
            name: "⭐ Google: Gemini 2.0 Flash (Recommended)",
            value: "google/gemini-2.0-flash-001",
          },
          {
            name: "⭐ Meta: Llama 3.3 70B (Recommended)",
            value: "meta-llama/llama-3.3-70b-instruct",
          },
          {
            name: "⭐ DeepSeek: Chat V3 (Recommended - Affordable)",
            value: "deepseek/deepseek-chat",
          },

          // ===== OpenAI Models =====
          {
            name: "OpenAI: GPT-4.1",
            value: "openai/gpt-4.1",
          },
          {
            name: "OpenAI: GPT-4.1 Mini",
            value: "openai/gpt-4.1-mini",
          },
          {
            name: "OpenAI: GPT-4.1 Nano",
            value: "openai/gpt-4.1-nano",
          },
          {
            name: "OpenAI: GPT-4o",
            value: "openai/gpt-4o",
          },
          {
            name: "OpenAI: GPT-4o Mini",
            value: "openai/gpt-4o-mini",
          },
          {
            name: "OpenAI: GPT-4o 2024-11-20",
            value: "openai/gpt-4o-2024-11-20",
          },
          {
            name: "OpenAI: GPT-4o 2024-08-06",
            value: "openai/gpt-4o-2024-08-06",
          },
          {
            name: "OpenAI: GPT-4o 2024-05-13",
            value: "openai/gpt-4o-2024-05-13",
          },
          {
            name: "OpenAI: GPT-4o Mini 2024-07-18",
            value: "openai/gpt-4o-mini-2024-07-18",
          },
          {
            name: "OpenAI: GPT-4 Turbo",
            value: "openai/gpt-4-turbo",
          },
          {
            name: "OpenAI: GPT-4 Turbo Preview",
            value: "openai/gpt-4-turbo-preview",
          },
          {
            name: "OpenAI: GPT-4 1106 Preview",
            value: "openai/gpt-4-1106-preview",
          },
          {
            name: "OpenAI: GPT-4",
            value: "openai/gpt-4",
          },
          {
            name: "OpenAI: GPT-4 32K",
            value: "openai/gpt-4-32k",
          },
          {
            name: "OpenAI: GPT-3.5 Turbo",
            value: "openai/gpt-3.5-turbo",
          },
          {
            name: "OpenAI: GPT-3.5 Turbo 16K",
            value: "openai/gpt-3.5-turbo-16k",
          },
          {
            name: "OpenAI: GPT-3.5 Turbo 0125",
            value: "openai/gpt-3.5-turbo-0125",
          },
          {
            name: "OpenAI: GPT-3.5 Turbo 1106",
            value: "openai/gpt-3.5-turbo-1106",
          },
          {
            name: "OpenAI: o1",
            value: "openai/o1",
          },
          {
            name: "OpenAI: o1 Mini",
            value: "openai/o1-mini",
          },
          {
            name: "OpenAI: o1 Preview",
            value: "openai/o1-preview",
          },
          {
            name: "OpenAI: o3 Mini",
            value: "openai/o3-mini",
          },
          {
            name: "OpenAI: o3 Mini High",
            value: "openai/o3-mini-high",
          },
          {
            name: "OpenAI: o4 Mini",
            value: "openai/o4-mini",
          },
          {
            name: "OpenAI: o4 Mini High",
            value: "openai/o4-mini-high",
          },

          // ===== Anthropic Models =====
          {
            name: "Anthropic: Claude Sonnet 4",
            value: "anthropic/claude-sonnet-4",
          },
          {
            name: "Anthropic: Claude Opus 4",
            value: "anthropic/claude-opus-4",
          },
          {
            name: "Anthropic: Claude 3.7 Sonnet",
            value: "anthropic/claude-3.7-sonnet",
          },
          {
            name: "Anthropic: Claude 3.5 Sonnet",
            value: "anthropic/claude-3.5-sonnet",
          },
          {
            name: "Anthropic: Claude 3.5 Sonnet 2024-10-22",
            value: "anthropic/claude-3.5-sonnet-20241022",
          },
          {
            name: "Anthropic: Claude 3.5 Haiku",
            value: "anthropic/claude-3.5-haiku",
          },
          {
            name: "Anthropic: Claude 3.5 Haiku 2024-10-22",
            value: "anthropic/claude-3.5-haiku-20241022",
          },
          {
            name: "Anthropic: Claude 3 Opus",
            value: "anthropic/claude-3-opus",
          },
          {
            name: "Anthropic: Claude 3 Opus 2024-02-29",
            value: "anthropic/claude-3-opus-20240229",
          },
          {
            name: "Anthropic: Claude 3 Sonnet",
            value: "anthropic/claude-3-sonnet",
          },
          {
            name: "Anthropic: Claude 3 Haiku",
            value: "anthropic/claude-3-haiku",
          },
          {
            name: "Anthropic: Claude 3 Haiku 2024-03-07",
            value: "anthropic/claude-3-haiku-20240307",
          },

          // ===== Google Models =====
          {
            name: "Google: Gemini 3 Flash Preview",
            value: "google/gemini-3-flash-preview",
          },
          {
            name: "Google: Gemini 2.5 Pro Preview",
            value: "google/gemini-2.5-pro-preview",
          },
          {
            name: "Google: Gemini 2.5 Flash Preview",
            value: "google/gemini-2.5-flash-preview",
          },
          {
            name: "Google: Gemini 2.0 Flash",
            value: "google/gemini-2.0-flash-001",
          },
          {
            name: "Google: Gemini 2.0 Flash Lite",
            value: "google/gemini-2.0-flash-lite-001",
          },
          {
            name: "Google: Gemini 2.0 Flash Exp",
            value: "google/gemini-2.0-flash-exp",
          },
          {
            name: "Google: Gemini 2.0 Flash Thinking Exp",
            value: "google/gemini-2.0-flash-thinking-exp",
          },
          {
            name: "Google: Gemini Pro 1.5",
            value: "google/gemini-pro-1.5",
          },
          {
            name: "Google: Gemini Flash 1.5",
            value: "google/gemini-flash-1.5",
          },
          {
            name: "Google: Gemini Flash 1.5 8B",
            value: "google/gemini-flash-1.5-8b",
          },
          {
            name: "Google: Gemini Pro",
            value: "google/gemini-pro",
          },
          {
            name: "Google: Gemma 3 27B",
            value: "google/gemma-3-27b-it",
          },
          {
            name: "Google: Gemma 3 12B",
            value: "google/gemma-3-12b-it",
          },
          {
            name: "Google: Gemma 3 4B",
            value: "google/gemma-3-4b-it",
          },
          {
            name: "Google: Gemma 3 1B",
            value: "google/gemma-3-1b-it",
          },
          {
            name: "Google: Gemma 2 27B",
            value: "google/gemma-2-27b-it",
          },
          {
            name: "Google: Gemma 2 9B",
            value: "google/gemma-2-9b-it",
          },

          // ===== Meta Llama Models =====
          {
            name: "Meta: Llama 4 Maverick",
            value: "meta-llama/llama-4-maverick",
          },
          {
            name: "Meta: Llama 4 Scout",
            value: "meta-llama/llama-4-scout",
          },
          {
            name: "Meta: Llama 3.3 70B Instruct",
            value: "meta-llama/llama-3.3-70b-instruct",
          },
          {
            name: "Meta: Llama 3.2 90B Vision Instruct",
            value: "meta-llama/llama-3.2-90b-vision-instruct",
          },
          {
            name: "Meta: Llama 3.2 11B Vision Instruct",
            value: "meta-llama/llama-3.2-11b-vision-instruct",
          },
          {
            name: "Meta: Llama 3.2 3B Instruct",
            value: "meta-llama/llama-3.2-3b-instruct",
          },
          {
            name: "Meta: Llama 3.2 1B Instruct",
            value: "meta-llama/llama-3.2-1b-instruct",
          },
          {
            name: "Meta: Llama 3.1 405B Instruct",
            value: "meta-llama/llama-3.1-405b-instruct",
          },
          {
            name: "Meta: Llama 3.1 70B Instruct",
            value: "meta-llama/llama-3.1-70b-instruct",
          },
          {
            name: "Meta: Llama 3.1 8B Instruct",
            value: "meta-llama/llama-3.1-8b-instruct",
          },
          {
            name: "Meta: Llama 3 70B Instruct",
            value: "meta-llama/llama-3-70b-instruct",
          },
          {
            name: "Meta: Llama 3 8B Instruct",
            value: "meta-llama/llama-3-8b-instruct",
          },

          // ===== Mistral Models =====
          {
            name: "Mistral: Large 2411",
            value: "mistralai/mistral-large-2411",
          },
          {
            name: "Mistral: Large 2407",
            value: "mistralai/mistral-large-2407",
          },
          {
            name: "Mistral: Large",
            value: "mistralai/mistral-large",
          },
          {
            name: "Mistral: Medium",
            value: "mistralai/mistral-medium",
          },
          {
            name: "Mistral: Small",
            value: "mistralai/mistral-small",
          },
          {
            name: "Mistral: Small 2503",
            value: "mistralai/mistral-small-2503",
          },
          {
            name: "Mistral: Small 2501",
            value: "mistralai/mistral-small-2501",
          },
          {
            name: "Mistral: Small 2409",
            value: "mistralai/mistral-small-2409",
          },
          {
            name: "Mistral: Small Creative",
            value: "mistralai/mistral-small-creative",
          },
          {
            name: "Mistral: Nemo",
            value: "mistralai/mistral-nemo",
          },
          {
            name: "Mistral: Mixtral 8x22B Instruct",
            value: "mistralai/mixtral-8x22b-instruct",
          },
          {
            name: "Mistral: Mixtral 8x7B Instruct",
            value: "mistralai/mixtral-8x7b-instruct",
          },
          {
            name: "Mistral: Pixtral Large",
            value: "mistralai/pixtral-large-latest",
          },
          {
            name: "Mistral: Pixtral 12B",
            value: "mistralai/pixtral-12b",
          },
          {
            name: "Mistral: Codestral",
            value: "mistralai/codestral-latest",
          },
          {
            name: "Mistral: Ministral 3B",
            value: "mistralai/ministral-3b",
          },
          {
            name: "Mistral: Ministral 8B",
            value: "mistralai/ministral-8b",
          },

          // ===== DeepSeek Models =====
          {
            name: "DeepSeek: R1",
            value: "deepseek/deepseek-r1",
          },
          {
            name: "DeepSeek: R1 0528",
            value: "deepseek/deepseek-r1-0528",
          },
          {
            name: "DeepSeek: R1 Distill Llama 70B",
            value: "deepseek/deepseek-r1-distill-llama-70b",
          },
          {
            name: "DeepSeek: R1 Distill Qwen 32B",
            value: "deepseek/deepseek-r1-distill-qwen-32b",
          },
          {
            name: "DeepSeek: R1 Distill Qwen 14B",
            value: "deepseek/deepseek-r1-distill-qwen-14b",
          },
          {
            name: "DeepSeek: Chat V3",
            value: "deepseek/deepseek-chat",
          },
          {
            name: "DeepSeek: Chat V3 0324",
            value: "deepseek/deepseek-chat-v3-0324",
          },
          {
            name: "DeepSeek: Coder",
            value: "deepseek/deepseek-coder",
          },
          {
            name: "DeepSeek: Prover V2",
            value: "deepseek/deepseek-prover-v2",
          },

          // ===== Qwen Models =====
          {
            name: "Qwen: Qwen3 235B A22B",
            value: "qwen/qwen3-235b-a22b",
          },
          {
            name: "Qwen: Qwen3 32B",
            value: "qwen/qwen3-32b",
          },
          {
            name: "Qwen: Qwen3 30B A3B",
            value: "qwen/qwen3-30b-a3b",
          },
          {
            name: "Qwen: Qwen3 14B",
            value: "qwen/qwen3-14b",
          },
          {
            name: "Qwen: Qwen3 8B",
            value: "qwen/qwen3-8b",
          },
          {
            name: "Qwen: Qwen3 4B",
            value: "qwen/qwen3-4b",
          },
          {
            name: "Qwen: Qwen3 1.7B",
            value: "qwen/qwen3-1.7b",
          },
          {
            name: "Qwen: Qwen 2.5 72B Instruct",
            value: "qwen/qwen-2.5-72b-instruct",
          },
          {
            name: "Qwen: Qwen 2.5 32B Instruct",
            value: "qwen/qwen-2.5-32b-instruct",
          },
          {
            name: "Qwen: Qwen 2.5 14B Instruct",
            value: "qwen/qwen-2.5-14b-instruct",
          },
          {
            name: "Qwen: Qwen 2.5 7B Instruct",
            value: "qwen/qwen-2.5-7b-instruct",
          },
          {
            name: "Qwen: Qwen 2.5 Coder 32B Instruct",
            value: "qwen/qwen-2.5-coder-32b-instruct",
          },
          {
            name: "Qwen: Qwen 2.5 Coder 7B Instruct",
            value: "qwen/qwen-2.5-coder-7b-instruct",
          },
          {
            name: "Qwen: QwQ 32B Preview",
            value: "qwen/qwq-32b-preview",
          },
          {
            name: "Qwen: QwQ 32B",
            value: "qwen/qwq-32b",
          },
          {
            name: "Qwen: Qwen 2 VL 72B Instruct",
            value: "qwen/qwen-2-vl-72b-instruct",
          },
          {
            name: "Qwen: Qwen 2 VL 7B Instruct",
            value: "qwen/qwen-2-vl-7b-instruct",
          },

          // ===== Cohere Models =====
          {
            name: "Cohere: Command R+",
            value: "cohere/command-r-plus",
          },
          {
            name: "Cohere: Command R+ 08-2024",
            value: "cohere/command-r-plus-08-2024",
          },
          {
            name: "Cohere: Command R+ 04-2024",
            value: "cohere/command-r-plus-04-2024",
          },
          {
            name: "Cohere: Command R",
            value: "cohere/command-r",
          },
          {
            name: "Cohere: Command R 08-2024",
            value: "cohere/command-r-08-2024",
          },
          {
            name: "Cohere: Command R 03-2024",
            value: "cohere/command-r-03-2024",
          },
          {
            name: "Cohere: Command A",
            value: "cohere/command-a",
          },

          // ===== xAI (Grok) Models =====
          {
            name: "xAI: Grok 3",
            value: "x-ai/grok-3",
          },
          {
            name: "xAI: Grok 3 Fast",
            value: "x-ai/grok-3-fast",
          },
          {
            name: "xAI: Grok 3 Mini",
            value: "x-ai/grok-3-mini",
          },
          {
            name: "xAI: Grok 3 Mini Fast",
            value: "x-ai/grok-3-mini-fast",
          },
          {
            name: "xAI: Grok 2",
            value: "x-ai/grok-2",
          },
          {
            name: "xAI: Grok 2 1212",
            value: "x-ai/grok-2-1212",
          },
          {
            name: "xAI: Grok 2 Vision 1212",
            value: "x-ai/grok-2-vision-1212",
          },
          {
            name: "xAI: Grok Beta",
            value: "x-ai/grok-beta",
          },

          // ===== NVIDIA Models =====
          {
            name: "NVIDIA: Llama 3.1 Nemotron 70B Instruct",
            value: "nvidia/llama-3.1-nemotron-70b-instruct",
          },
          {
            name: "NVIDIA: Llama 3.3 Nemotron Super 49B V1",
            value: "nvidia/llama-3.3-nemotron-super-49b-v1",
          },

          // ===== Microsoft Models =====
          {
            name: "Microsoft: Phi-4",
            value: "microsoft/phi-4",
          },
          {
            name: "Microsoft: Phi-4 Multimodal Instruct",
            value: "microsoft/phi-4-multimodal-instruct",
          },
          {
            name: "Microsoft: MAI DS R1",
            value: "microsoft/mai-ds-r1",
          },

          // ===== Amazon Models =====
          {
            name: "Amazon: Nova Pro 1.0",
            value: "amazon/nova-pro-v1",
          },
          {
            name: "Amazon: Nova Lite 1.0",
            value: "amazon/nova-lite-v1",
          },
          {
            name: "Amazon: Nova Micro 1.0",
            value: "amazon/nova-micro-v1",
          },

          // ===== Perplexity Models =====
          {
            name: "Perplexity: Sonar Deep Research",
            value: "perplexity/sonar-deep-research",
          },
          {
            name: "Perplexity: Sonar Pro",
            value: "perplexity/sonar-pro",
          },
          {
            name: "Perplexity: Sonar",
            value: "perplexity/sonar",
          },
          {
            name: "Perplexity: Sonar Reasoning Pro",
            value: "perplexity/sonar-reasoning-pro",
          },
          {
            name: "Perplexity: Sonar Reasoning",
            value: "perplexity/sonar-reasoning",
          },

          // ===== Nous Research Models =====
          {
            name: "Nous: Hermes 3 405B Instruct",
            value: "nousresearch/hermes-3-llama-3.1-405b",
          },
          {
            name: "Nous: Hermes 3 70B Instruct",
            value: "nousresearch/hermes-3-llama-3.1-70b",
          },

          // ===== 01.AI Models =====
          {
            name: "01.AI: Yi Large",
            value: "01-ai/yi-large",
          },
          {
            name: "01.AI: Yi Large FC",
            value: "01-ai/yi-large-fc",
          },
          {
            name: "01.AI: Yi Large Turbo",
            value: "01-ai/yi-large-turbo",
          },

          // ===== Inflection Models =====
          {
            name: "Inflection: Inflection 3 Pi",
            value: "inflection/inflection-3-pi",
          },
          {
            name: "Inflection: Inflection 3 Productivity",
            value: "inflection/inflection-3-productivity",
          },

          // ===== AI21 Models =====
          {
            name: "AI21: Jamba 1.5 Large",
            value: "ai21/jamba-1.5-large",
          },
          {
            name: "AI21: Jamba 1.5 Mini",
            value: "ai21/jamba-1.5-mini",
          },

          // ===== Databricks Models =====
          {
            name: "Databricks: DBRX Instruct",
            value: "databricks/dbrx-instruct",
          },

          // ===== Fireworks Models =====
          {
            name: "Fireworks: Firellama 405B Instruct",
            value: "fireworks/firellama-405b-instruct",
          },

          // ===== Groq Models =====
          {
            name: "Groq: Llama 3.3 70B Versatile",
            value: "groq/llama-3.3-70b-versatile",
          },
          {
            name: "Groq: Llama 3.1 8B Instant",
            value: "groq/llama-3.1-8b-instant",
          },

          // ===== Cognitive Computations Models =====
          {
            name: "Cognitive Computations: Dolphin 3.0 R1 Mistral 24B",
            value: "cognitivecomputations/dolphin-3.0-r1-mistral-24b",
          },
          {
            name: "Cognitive Computations: Dolphin 3.0 Mistral 24B",
            value: "cognitivecomputations/dolphin-3.0-mistral-24b",
          },

          // ===== FREE MODELS (with tool support) =====
          {
            name: "[FREE] NVIDIA: Nemotron 3 Nano 30B",
            value: "nvidia/nemotron-3-nano-30b-a3b:free",
          },
          {
            name: "[FREE] Xiaomi: MiMo V2 Flash",
            value: "xiaomi/mimo-v2-flash:free",
          },
          {
            name: "[FREE] Meta: Llama 3.1 8B Instruct",
            value: "meta-llama/llama-3.1-8b-instruct:free",
          },
          {
            name: "[FREE] Meta: Llama 3.2 3B Instruct",
            value: "meta-llama/llama-3.2-3b-instruct:free",
          },
          {
            name: "[FREE] Qwen: Qwen3 8B",
            value: "qwen/qwen3-8b:free",
          },
          {
            name: "[FREE] Qwen: Qwen3 4B",
            value: "qwen/qwen3-4b:free",
          },
          {
            name: "[FREE] Qwen: Qwen 2.5 7B Instruct",
            value: "qwen/qwen-2.5-7b-instruct:free",
          },
          {
            name: "[FREE] Qwen: Qwen 2.5 Coder 7B Instruct",
            value: "qwen/qwen-2.5-coder-7b-instruct:free",
          },
          {
            name: "[FREE] Google: Gemma 2 9B",
            value: "google/gemma-2-9b-it:free",
          },
          {
            name: "[FREE] Mistral: Mistral Small 3.1 24B",
            value: "mistralai/mistral-small-3.1-24b-instruct:free",
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
