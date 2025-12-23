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
          // ==================== RECOMMENDED ====================
          {
            name: "⭐ GPT-4o Mini (Recommended)",
            value: "openai/gpt-4o-mini",
            description: "Best balance of speed, quality and cost. Great default choice.",
          },
          {
            name: "⭐ Claude 3.5 Sonnet (Recommended)",
            value: "anthropic/claude-3.5-sonnet",
            description: "Excellent for complex reasoning, coding, and long-form content.",
          },
          {
            name: "⭐ Gemini 2.0 Flash (Recommended)",
            value: "google/gemini-2.0-flash-001",
            description: "Google's fast model with 1M context. Great for large documents.",
          },
          {
            name: "⭐ DeepSeek Chat V3 (Recommended - Affordable)",
            value: "deepseek/deepseek-chat",
            description: "Very affordable with strong performance across tasks.",
          },

          // ==================== OPENAI MODELS ====================
          {
            name: "OpenAI: GPT-5",
            value: "openai/gpt-5",
            description: "Latest GPT-5. Top-tier performance.",
          },
          {
            name: "OpenAI: GPT-5 Pro",
            value: "openai/gpt-5-pro",
            description: "GPT-5 Pro variant. Enhanced capabilities.",
          },
          {
            name: "OpenAI: GPT-5 Mini",
            value: "openai/gpt-5-mini",
            description: "Smaller GPT-5 variant. Fast and cost-effective.",
          },
          {
            name: "OpenAI: GPT-5 Nano",
            value: "openai/gpt-5-nano",
            description: "Smallest GPT-5. Ultra-fast responses.",
          },
          {
            name: "OpenAI: GPT-4.1",
            value: "openai/gpt-4.1",
            description: "Latest GPT-4.1 with improved instruction following.",
          },
          {
            name: "OpenAI: GPT-4.1 Mini",
            value: "openai/gpt-4.1-mini",
            description: "Smaller, faster GPT-4.1 variant.",
          },
          {
            name: "OpenAI: GPT-4.1 Nano",
            value: "openai/gpt-4.1-nano",
            description: "Smallest GPT-4.1. Ultra-fast and cheapest.",
          },
          {
            name: "OpenAI: GPT-4o",
            value: "openai/gpt-4o",
            description: "OpenAI's flagship multimodal model. 128K context.",
          },
          {
            name: "OpenAI: GPT-4o Mini",
            value: "openai/gpt-4o-mini",
            description: "Fast and affordable GPT-4o variant.",
          },
          {
            name: "OpenAI: GPT-4 Turbo",
            value: "openai/gpt-4-turbo",
            description: "GPT-4 with 128K context.",
          },
          {
            name: "OpenAI: GPT-4",
            value: "openai/gpt-4",
            description: "Original GPT-4. 8K context. Reliable.",
          },
          {
            name: "OpenAI: GPT-3.5 Turbo",
            value: "openai/gpt-3.5-turbo",
            description: "Fast and affordable. 16K context.",
          },
          {
            name: "[REASONING] OpenAI: o1",
            value: "openai/o1",
            description: "Advanced reasoning model. Step-by-step thinking.",
          },
          {
            name: "[REASONING] OpenAI: o3",
            value: "openai/o3",
            description: "Latest reasoning model from OpenAI.",
          },
          {
            name: "[REASONING] OpenAI: o3 Mini",
            value: "openai/o3-mini",
            description: "Compact reasoning model. Fast chain-of-thought.",
          },
          {
            name: "[REASONING] OpenAI: o3 Mini High",
            value: "openai/o3-mini-high",
            description: "o3 Mini with higher compute budget.",
          },
          {
            name: "[REASONING] OpenAI: o3 Pro",
            value: "openai/o3-pro",
            description: "Professional reasoning model.",
          },
          {
            name: "[REASONING] OpenAI: o4 Mini",
            value: "openai/o4-mini",
            description: "Latest compact reasoning model.",
          },
          {
            name: "[REASONING] OpenAI: o4 Mini High",
            value: "openai/o4-mini-high",
            description: "o4 Mini with extended reasoning.",
          },

          // ==================== ANTHROPIC MODELS ====================
          {
            name: "Anthropic: Claude Sonnet 4.5",
            value: "anthropic/claude-sonnet-4.5",
            description: "Latest Claude 4.5 Sonnet. Excellent all-around.",
          },
          {
            name: "Anthropic: Claude Sonnet 4",
            value: "anthropic/claude-sonnet-4",
            description: "Claude 4. Great reasoning and coding.",
          },
          {
            name: "Anthropic: Claude Opus 4.5",
            value: "anthropic/claude-opus-4.5",
            description: "Most capable Claude 4.5. Complex tasks.",
          },
          {
            name: "Anthropic: Claude Opus 4.1",
            value: "anthropic/claude-opus-4.1",
            description: "Claude Opus 4.1. Enhanced capabilities.",
          },
          {
            name: "Anthropic: Claude Opus 4",
            value: "anthropic/claude-opus-4",
            description: "Claude 4 Opus. Best for nuanced tasks.",
          },
          {
            name: "Anthropic: Claude Haiku 4.5",
            value: "anthropic/claude-haiku-4.5",
            description: "Fast Claude 4.5. High-volume tasks.",
          },
          {
            name: "Anthropic: Claude 3.7 Sonnet",
            value: "anthropic/claude-3.7-sonnet",
            description: "Improved Claude 3.5 Sonnet. Better reasoning.",
          },
          {
            name: "Anthropic: Claude 3.5 Sonnet",
            value: "anthropic/claude-3.5-sonnet",
            description: "Excellent capability and speed. 200K context.",
          },
          {
            name: "Anthropic: Claude 3.5 Haiku",
            value: "anthropic/claude-3.5-haiku",
            description: "Fast and affordable Claude.",
          },
          {
            name: "Anthropic: Claude 3 Opus",
            value: "anthropic/claude-3-opus",
            description: "Most capable Claude 3. Complex analysis.",
          },
          {
            name: "Anthropic: Claude 3 Haiku",
            value: "anthropic/claude-3-haiku",
            description: "Fastest Claude 3. Near-instant responses.",
          },

          // ==================== GOOGLE MODELS ====================
          {
            name: "Google: Gemini 3 Flash Preview",
            value: "google/gemini-3-flash-preview",
            description: "Next-gen Gemini. High speed. 1M context.",
          },
          {
            name: "Google: Gemini 3 Pro Preview",
            value: "google/gemini-3-pro-preview",
            description: "Gemini 3 Pro. Most capable.",
          },
          {
            name: "Google: Gemini 2.5 Pro",
            value: "google/gemini-2.5-pro",
            description: "Most capable Gemini 2.5. Excellent reasoning.",
          },
          {
            name: "Google: Gemini 2.5 Pro Preview",
            value: "google/gemini-2.5-pro-preview",
            description: "Preview of Gemini 2.5 Pro.",
          },
          {
            name: "Google: Gemini 2.5 Flash",
            value: "google/gemini-2.5-flash",
            description: "Fast Gemini 2.5 with thinking. 1M context.",
          },
          {
            name: "Google: Gemini 2.5 Flash Lite",
            value: "google/gemini-2.5-flash-lite",
            description: "Lightweight Gemini 2.5 Flash.",
          },
          {
            name: "Google: Gemini 2.0 Flash",
            value: "google/gemini-2.0-flash-001",
            description: "Production Gemini 2.0. Fast with 1M context.",
          },
          {
            name: "Google: Gemini 2.0 Flash Lite",
            value: "google/gemini-2.0-flash-lite-001",
            description: "Lightweight Gemini 2.0. Very fast.",
          },
          {
            name: "Google: Gemma 3 27B",
            value: "google/gemma-3-27b-it",
            description: "Open-source Gemma 3. Strong performance.",
          },
          {
            name: "Google: Gemma 3 12B",
            value: "google/gemma-3-12b-it",
            description: "Mid-size Gemma 3. Good balance.",
          },
          {
            name: "Google: Gemma 3 4B",
            value: "google/gemma-3-4b-it",
            description: "Small Gemma 3. Fast and efficient.",
          },
          {
            name: "Google: Gemma 2 27B",
            value: "google/gemma-2-27b-it",
            description: "Largest Gemma 2. Strong open-source.",
          },
          {
            name: "Google: Gemma 2 9B",
            value: "google/gemma-2-9b-it",
            description: "Efficient Gemma 2. Great quality for size.",
          },

          // ==================== META LLAMA MODELS ====================
          {
            name: "Meta: Llama 4 Maverick",
            value: "meta-llama/llama-4-maverick",
            description: "Latest Llama 4. Frontier-class open model.",
          },
          {
            name: "Meta: Llama 4 Scout",
            value: "meta-llama/llama-4-scout",
            description: "Efficient Llama 4 variant.",
          },
          {
            name: "Meta: Llama 3.3 70B",
            value: "meta-llama/llama-3.3-70b-instruct",
            description: "Latest 70B Llama. Matches 405B on many tasks.",
          },
          {
            name: "Meta: Llama 3.2 90B Vision",
            value: "meta-llama/llama-3.2-90b-vision-instruct",
            description: "Multimodal Llama 3.2. Vision + text.",
          },
          {
            name: "Meta: Llama 3.2 11B Vision",
            value: "meta-llama/llama-3.2-11b-vision-instruct",
            description: "Compact multimodal Llama.",
          },
          {
            name: "Meta: Llama 3.2 3B",
            value: "meta-llama/llama-3.2-3b-instruct",
            description: "Compact Llama 3.2. Fast for simple tasks.",
          },
          {
            name: "Meta: Llama 3.2 1B",
            value: "meta-llama/llama-3.2-1b-instruct",
            description: "Smallest Llama 3.2. Ultra-fast.",
          },
          {
            name: "Meta: Llama 3.1 405B",
            value: "meta-llama/llama-3.1-405b-instruct",
            description: "Largest open model. GPT-4 class.",
          },
          {
            name: "Meta: Llama 3.1 70B",
            value: "meta-llama/llama-3.1-70b-instruct",
            description: "Strong 70B model. 128K context.",
          },
          {
            name: "Meta: Llama 3.1 8B",
            value: "meta-llama/llama-3.1-8b-instruct",
            description: "Efficient 8B Llama. Fast.",
          },
          {
            name: "Meta: Llama 3 70B",
            value: "meta-llama/llama-3-70b-instruct",
            description: "Original Llama 3 70B. Reliable.",
          },
          {
            name: "Meta: Llama 3 8B",
            value: "meta-llama/llama-3-8b-instruct",
            description: "Efficient Llama 3 8B.",
          },

          // ==================== MISTRAL MODELS ====================
          {
            name: "Mistral: Large 2512",
            value: "mistralai/mistral-large-2512",
            description: "Latest Mistral Large. Strong reasoning.",
          },
          {
            name: "Mistral: Large 2411",
            value: "mistralai/mistral-large-2411",
            description: "Previous Mistral Large release.",
          },
          {
            name: "Mistral: Large",
            value: "mistralai/mistral-large",
            description: "Mistral's flagship model.",
          },
          {
            name: "Mistral: Medium 3.1",
            value: "mistralai/mistral-medium-3.1",
            description: "Balanced Mistral. Good quality.",
          },
          {
            name: "Mistral: Small 3.2 24B",
            value: "mistralai/mistral-small-3.2-24b-instruct",
            description: "Latest Mistral Small. Fast and efficient.",
          },
          {
            name: "Mistral: Small 3.1 24B",
            value: "mistralai/mistral-small-3.1-24b-instruct",
            description: "Previous Mistral Small release.",
          },
          {
            name: "Mistral: Small Creative",
            value: "mistralai/mistral-small-creative",
            description: "Optimized for creative writing.",
          },
          {
            name: "Mistral: Nemo",
            value: "mistralai/mistral-nemo",
            description: "12B parameter model. Great balance.",
          },
          {
            name: "Mistral: Saba",
            value: "mistralai/mistral-saba",
            description: "Efficient Mistral model.",
          },
          {
            name: "Mistral: Mixtral 8x22B",
            value: "mistralai/mixtral-8x22b-instruct",
            description: "Large MoE model. High quality.",
          },
          {
            name: "Mistral: Mixtral 8x7B",
            value: "mistralai/mixtral-8x7b-instruct",
            description: "Efficient MoE model.",
          },
          {
            name: "[CODING] Mistral: Codestral 2508",
            value: "mistralai/codestral-2508",
            description: "Specialized for code. Multi-language.",
          },
          {
            name: "[CODING] Mistral: Devstral 2512",
            value: "mistralai/devstral-2512",
            description: "Development-focused Mistral.",
          },
          {
            name: "Mistral: Pixtral Large 2411",
            value: "mistralai/pixtral-large-2411",
            description: "Large multimodal Mistral.",
          },
          {
            name: "Mistral: Pixtral 12B",
            value: "mistralai/pixtral-12b",
            description: "Compact multimodal Mistral.",
          },
          {
            name: "Mistral: Ministral 14B 2512",
            value: "mistralai/ministral-14b-2512",
            description: "Mid-size Ministral.",
          },
          {
            name: "Mistral: Ministral 8B",
            value: "mistralai/ministral-8b",
            description: "Small but capable.",
          },
          {
            name: "Mistral: Ministral 3B",
            value: "mistralai/ministral-3b",
            description: "Tiny Mistral. Ultra-fast.",
          },
          {
            name: "Mistral: 7B Instruct",
            value: "mistralai/mistral-7b-instruct",
            description: "Classic Mistral 7B.",
          },

          // ==================== DEEPSEEK MODELS ====================
          {
            name: "DeepSeek: V3.2",
            value: "deepseek/deepseek-v3.2",
            description: "Latest DeepSeek V3.2. Strong performance.",
          },
          {
            name: "DeepSeek: V3.2 Exp",
            value: "deepseek/deepseek-v3.2-exp",
            description: "Experimental DeepSeek V3.2.",
          },
          {
            name: "DeepSeek: Chat V3.1",
            value: "deepseek/deepseek-chat-v3.1",
            description: "Latest Chat V3.1 release.",
          },
          {
            name: "DeepSeek: Chat V3",
            value: "deepseek/deepseek-chat",
            description: "General chat model. Very affordable.",
          },
          {
            name: "[REASONING] DeepSeek: R1",
            value: "deepseek/deepseek-r1",
            description: "Advanced reasoning. Excels at math and logic.",
          },
          {
            name: "[REASONING] DeepSeek: R1 0528",
            value: "deepseek/deepseek-r1-0528",
            description: "Latest R1 release.",
          },
          {
            name: "[REASONING] DeepSeek: R1 Distill Llama 70B",
            value: "deepseek/deepseek-r1-distill-llama-70b",
            description: "R1 reasoning in Llama 70B.",
          },
          {
            name: "[REASONING] DeepSeek: R1 Distill Qwen 32B",
            value: "deepseek/deepseek-r1-distill-qwen-32b",
            description: "R1 reasoning in Qwen 32B.",
          },
          {
            name: "[REASONING] DeepSeek: R1 Distill Qwen 14B",
            value: "deepseek/deepseek-r1-distill-qwen-14b",
            description: "Compact R1 distillation.",
          },
          {
            name: "[REASONING] DeepSeek: Prover V2",
            value: "deepseek/deepseek-prover-v2",
            description: "Mathematical theorem proving.",
          },

          // ==================== QWEN MODELS ====================
          {
            name: "Qwen: Qwen3 235B A22B",
            value: "qwen/qwen3-235b-a22b",
            description: "Largest Qwen 3. 235B total, 22B active.",
          },
          {
            name: "Qwen: Qwen3 Max",
            value: "qwen/qwen3-max",
            description: "Maximum capability Qwen 3.",
          },
          {
            name: "Qwen: Qwen3 32B",
            value: "qwen/qwen3-32b",
            description: "Strong mid-size Qwen 3.",
          },
          {
            name: "Qwen: Qwen3 30B A3B",
            value: "qwen/qwen3-30b-a3b",
            description: "Efficient MoE Qwen 3.",
          },
          {
            name: "Qwen: Qwen3 14B",
            value: "qwen/qwen3-14b",
            description: "Balanced Qwen 3.",
          },
          {
            name: "Qwen: Qwen3 8B",
            value: "qwen/qwen3-8b",
            description: "Efficient Qwen 3.",
          },
          {
            name: "[CODING] Qwen: Qwen3 Coder",
            value: "qwen/qwen3-coder",
            description: "Code-specialized Qwen 3.",
          },
          {
            name: "[CODING] Qwen: Qwen3 Coder Flash",
            value: "qwen/qwen3-coder-flash",
            description: "Fast code generation.",
          },
          {
            name: "Qwen: Qwen Max",
            value: "qwen/qwen-max",
            description: "Maximum capability Qwen.",
          },
          {
            name: "Qwen: Qwen Plus",
            value: "qwen/qwen-plus",
            description: "Enhanced Qwen model.",
          },
          {
            name: "Qwen: Qwen Turbo",
            value: "qwen/qwen-turbo",
            description: "Fast Qwen model.",
          },
          {
            name: "Qwen: Qwen 2.5 72B",
            value: "qwen/qwen-2.5-72b-instruct",
            description: "Largest Qwen 2.5. 128K context.",
          },
          {
            name: "[CODING] Qwen: Qwen 2.5 Coder 32B",
            value: "qwen/qwen-2.5-coder-32b-instruct",
            description: "Specialized for code. Strong.",
          },
          {
            name: "Qwen: Qwen 2.5 7B",
            value: "qwen/qwen-2.5-7b-instruct",
            description: "Compact Qwen 2.5.",
          },
          {
            name: "[REASONING] Qwen: QwQ 32B",
            value: "qwen/qwq-32b",
            description: "Reasoning-focused Qwen.",
          },

          // ==================== COHERE MODELS ====================
          {
            name: "Cohere: Command A",
            value: "cohere/command-a",
            description: "Latest Command series. Enterprise performance.",
          },
          {
            name: "Cohere: Command R+ 08-2024",
            value: "cohere/command-r-plus-08-2024",
            description: "August 2024 release of Command R+.",
          },
          {
            name: "Cohere: Command R 08-2024",
            value: "cohere/command-r-08-2024",
            description: "August 2024 release of Command R.",
          },
          {
            name: "Cohere: Command R7B 12-2024",
            value: "cohere/command-r7b-12-2024",
            description: "Compact Command R. December 2024.",
          },

          // ==================== XAI (GROK) MODELS ====================
          {
            name: "xAI: Grok 4",
            value: "x-ai/grok-4",
            description: "Latest Grok 4. Top performance.",
          },
          {
            name: "xAI: Grok 4 Fast",
            value: "x-ai/grok-4-fast",
            description: "Fast Grok 4 variant.",
          },
          {
            name: "xAI: Grok 4.1 Fast",
            value: "x-ai/grok-4.1-fast",
            description: "Enhanced Grok 4.1 Fast.",
          },
          {
            name: "xAI: Grok 3",
            value: "x-ai/grok-3",
            description: "Grok 3. Strong reasoning.",
          },
          {
            name: "xAI: Grok 3 Beta",
            value: "x-ai/grok-3-beta",
            description: "Beta Grok 3 features.",
          },
          {
            name: "xAI: Grok 3 Mini",
            value: "x-ai/grok-3-mini",
            description: "Compact Grok 3.",
          },
          {
            name: "xAI: Grok 3 Mini Beta",
            value: "x-ai/grok-3-mini-beta",
            description: "Beta Grok 3 Mini.",
          },
          {
            name: "[CODING] xAI: Grok Code Fast 1",
            value: "x-ai/grok-code-fast-1",
            description: "Fast code generation.",
          },

          // ==================== OTHER PROVIDERS ====================
          {
            name: "NVIDIA: Llama 3.1 Nemotron 70B",
            value: "nvidia/llama-3.1-nemotron-70b-instruct",
            description: "NVIDIA-optimized Llama 3.1.",
          },
          {
            name: "NVIDIA: Llama 3.3 Nemotron Super 49B V1.5",
            value: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
            description: "Optimized 49B model.",
          },
          {
            name: "NVIDIA: Nemotron 3 Nano 30B",
            value: "nvidia/nemotron-3-nano-30b-a3b",
            description: "Efficient MoE architecture.",
          },
          {
            name: "Microsoft: Phi-4",
            value: "microsoft/phi-4",
            description: "Small but mighty. 14B params.",
          },
          {
            name: "Microsoft: Phi-4 Reasoning Plus",
            value: "microsoft/phi-4-reasoning-plus",
            description: "Phi-4 with enhanced reasoning.",
          },
          {
            name: "Amazon: Nova Premier",
            value: "amazon/nova-premier-v1",
            description: "Top-tier AWS model.",
          },
          {
            name: "Amazon: Nova Pro",
            value: "amazon/nova-pro-v1",
            description: "AWS's capable model.",
          },
          {
            name: "Amazon: Nova Lite",
            value: "amazon/nova-lite-v1",
            description: "Efficient AWS model.",
          },
          {
            name: "Amazon: Nova Micro",
            value: "amazon/nova-micro-v1",
            description: "Smallest AWS model.",
          },
          {
            name: "[SEARCH] Perplexity: Sonar Deep Research",
            value: "perplexity/sonar-deep-research",
            description: "Deep web research. Multi-step search.",
          },
          {
            name: "[SEARCH] Perplexity: Sonar Pro",
            value: "perplexity/sonar-pro",
            description: "Advanced search-augmented model.",
          },
          {
            name: "[SEARCH] Perplexity: Sonar",
            value: "perplexity/sonar",
            description: "Search-augmented responses.",
          },
          {
            name: "Moonshot: Kimi K2",
            value: "moonshotai/kimi-k2",
            description: "Moonshot's Kimi K2 model.",
          },
          {
            name: "Moonshot: Kimi K2 Thinking",
            value: "moonshotai/kimi-k2-thinking",
            description: "Kimi K2 with reasoning.",
          },
          {
            name: "NousResearch: Hermes 4 405B",
            value: "nousresearch/hermes-4-405b",
            description: "Fine-tuned Llama. Enhanced capabilities.",
          },
          {
            name: "NousResearch: Hermes 4 70B",
            value: "nousresearch/hermes-4-70b",
            description: "Fine-tuned 70B model.",
          },
          {
            name: "Inflection: Inflection 3 Pi",
            value: "inflection/inflection-3-pi",
            description: "Conversational AI. Empathetic.",
          },
          {
            name: "AI21: Jamba Large 1.7",
            value: "ai21/jamba-large-1.7",
            description: "Mamba-based. 256K context.",
          },
          {
            name: "AI21: Jamba Mini 1.7",
            value: "ai21/jamba-mini-1.7",
            description: "Compact Jamba.",
          },
          {
            name: "MiniMax: MiniMax M2",
            value: "minimax/minimax-m2",
            description: "MiniMax's M2 model.",
          },
          {
            name: "Inception: Mercury",
            value: "inception/mercury",
            description: "Inception's Mercury model.",
          },
          {
            name: "Inception: Mercury Coder",
            value: "inception/mercury-coder",
            description: "Code-focused Mercury.",
          },
          {
            name: "TNG: R1T Chimera",
            value: "tngtech/tng-r1t-chimera",
            description: "TNG's R1T Chimera model.",
          },
          {
            name: "[ROLEPLAY] Gryphe: MythoMax 13B",
            value: "gryphe/mythomax-l2-13b",
            description: "Popular roleplay model.",
          },
          {
            name: "[ROLEPLAY] Mancer: Weaver",
            value: "mancer/weaver",
            description: "Roleplay and narrative.",
          },

          // ==================== FREE MODELS ====================
          {
            name: "[FREE] Meta: Llama 3.3 70B",
            value: "meta-llama/llama-3.3-70b-instruct:free",
            description: "Free tier Llama 3.3 70B.",
          },
          {
            name: "[FREE] Meta: Llama 3.2 3B",
            value: "meta-llama/llama-3.2-3b-instruct:free",
            description: "Free tier Llama 3.2 3B.",
          },
          {
            name: "[FREE] Meta: Llama 3.1 405B",
            value: "meta-llama/llama-3.1-405b-instruct:free",
            description: "Free tier Llama 3.1 405B.",
          },
          {
            name: "[FREE] Google: Gemini 2.0 Flash Exp",
            value: "google/gemini-2.0-flash-exp:free",
            description: "Free tier Gemini 2.0 Flash.",
          },
          {
            name: "[FREE] Google: Gemma 3 27B",
            value: "google/gemma-3-27b-it:free",
            description: "Free tier Gemma 3 27B.",
          },
          {
            name: "[FREE] Google: Gemma 3 12B",
            value: "google/gemma-3-12b-it:free",
            description: "Free tier Gemma 3 12B.",
          },
          {
            name: "[FREE] Google: Gemma 3 4B",
            value: "google/gemma-3-4b-it:free",
            description: "Free tier Gemma 3 4B.",
          },
          {
            name: "[FREE] Qwen: Qwen3 4B",
            value: "qwen/qwen3-4b:free",
            description: "Free tier Qwen3 4B.",
          },
          {
            name: "[FREE] Qwen: Qwen3 Coder",
            value: "qwen/qwen3-coder:free",
            description: "Free tier Qwen3 Coder.",
          },
          {
            name: "[FREE] Mistral: Small 3.1 24B",
            value: "mistralai/mistral-small-3.1-24b-instruct:free",
            description: "Free tier Mistral Small.",
          },
          {
            name: "[FREE] Mistral: Devstral 2512",
            value: "mistralai/devstral-2512:free",
            description: "Free tier Devstral.",
          },
          {
            name: "[FREE] Mistral: 7B Instruct",
            value: "mistralai/mistral-7b-instruct:free",
            description: "Free tier Mistral 7B.",
          },
          {
            name: "[FREE] NVIDIA: Nemotron 3 Nano 30B",
            value: "nvidia/nemotron-3-nano-30b-a3b:free",
            description: "Free tier NVIDIA Nemotron.",
          },
          {
            name: "[FREE] NVIDIA: Nemotron Nano 9B V2",
            value: "nvidia/nemotron-nano-9b-v2:free",
            description: "Free tier Nemotron Nano.",
          },
          {
            name: "[FREE] Xiaomi: MiMo V2 Flash",
            value: "xiaomi/mimo-v2-flash:free",
            description: "Free tier Xiaomi MiMo. 309B MoE.",
          },
          {
            name: "[FREE] [REASONING] AllenAI: Olmo 3.1 32B Think",
            value: "allenai/olmo-3.1-32b-think:free",
            description: "Free reasoning model. Chain-of-thought.",
          },
          {
            name: "[FREE] DeepSeek: R1 0528",
            value: "deepseek/deepseek-r1-0528:free",
            description: "Free tier DeepSeek R1.",
          },
          {
            name: "[FREE] TNG: R1T Chimera",
            value: "tngtech/tng-r1t-chimera:free",
            description: "Free tier TNG R1T Chimera.",
          },
          {
            name: "[FREE] Moonshot: Kimi K2",
            value: "moonshotai/kimi-k2:free",
            description: "Free tier Kimi K2.",
          },
          {
            name: "[FREE] Alibaba: Tongyi DeepResearch 30B",
            value: "alibaba/tongyi-deepresearch-30b-a3b:free",
            description: "Free tier Alibaba research model.",
          },
          {
            name: "[FREE] OpenAI: GPT OSS 120B",
            value: "openai/gpt-oss-120b:free",
            description: "Free tier OpenAI OSS 120B.",
          },
          {
            name: "[FREE] NousResearch: Hermes 3 405B",
            value: "nousresearch/hermes-3-llama-3.1-405b:free",
            description: "Free tier Hermes 3 405B.",
          },
        ],
        default: "openai/gpt-4o-mini",
        description:
          "Select a model or type a model ID. Examples: 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-pro-1.5'",
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
            "Model must be specified. Enter a model ID (e.g., 'openai/gpt-4o' or 'anthropic/claude-3.5-sonnet').",
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
          content:
            response.choices?.[0]?.message?.content ||
            response.choices?.[0]?.text ||
            response.content,
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
