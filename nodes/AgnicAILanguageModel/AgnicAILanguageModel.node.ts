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
 * Format: { name: "Display Name", value: "model-id" }
 * ⭐ = Recommended models (top picks for general use)
 * 🆓 = Free tier available with tool support
 */
const SUPPORTED_MODELS = [
  // ═══════════════════════════════════════════════════════════════════
  // ⭐ RECOMMENDED MODELS - Best balance of quality, speed & cost
  // ═══════════════════════════════════════════════════════════════════
  { name: "⭐ OpenAI: GPT-4o (Best Overall)", value: "openai/gpt-4o" },
  { name: "⭐ OpenAI: GPT-4o Mini (Fast & Affordable)", value: "openai/gpt-4o-mini" },
  { name: "⭐ Anthropic: Claude Sonnet 4 (Latest)", value: "anthropic/claude-sonnet-4" },
  { name: "⭐ Anthropic: Claude 3.5 Sonnet (Popular)", value: "anthropic/claude-3.5-sonnet" },
  { name: "⭐ Google: Gemini 2.5 Pro Preview", value: "google/gemini-2.5-pro-preview" },
  { name: "⭐ Google: Gemini 2.5 Flash", value: "google/gemini-2.5-flash" },
  { name: "⭐ Google: Gemini 3 Flash Preview", value: "google/gemini-3-flash-preview" },
  { name: "⭐ DeepSeek: DeepSeek Chat V3 (Best Value)", value: "deepseek/deepseek-chat" },
  { name: "⭐ DeepSeek: DeepSeek R1 (Reasoning)", value: "deepseek/deepseek-r1" },
  { name: "⭐ Meta: Llama 4 Maverick", value: "meta-llama/llama-4-maverick" },
  { name: "⭐ Meta: Llama 4 Scout", value: "meta-llama/llama-4-scout" },
  { name: "⭐ xAI: Grok 3", value: "x-ai/grok-3" },
  { name: "⭐ xAI: Grok 3 Mini", value: "x-ai/grok-3-mini" },

  // ═══════════════════════════════════════════════════════════════════
  // 🆓 FREE MODELS WITH TOOL SUPPORT - Great for testing
  // ═══════════════════════════════════════════════════════════════════
  { name: "🆓 Meta: Llama 3.3 70B (Free)", value: "meta-llama/llama-3.3-70b-instruct:free" },
  { name: "🆓 Google: Gemma 3 27B (Free)", value: "google/gemma-3-27b-it:free" },
  { name: "🆓 Google: Gemini 2.0 Flash Exp (Free)", value: "google/gemini-2.0-flash-exp:free" },
  { name: "🆓 Mistral: Mistral Small 3.1 24B (Free)", value: "mistralai/mistral-small-3.1-24b-instruct:free" },
  { name: "🆓 Mistral: Mistral 7B (Free)", value: "mistralai/mistral-7b-instruct:free" },
  { name: "🆓 Mistral: Devstral 2512 (Free)", value: "mistralai/devstral-2512:free" },
  { name: "🆓 NVIDIA: Nemotron 3 Nano 30B (Free)", value: "nvidia/nemotron-3-nano-30b-a3b:free" },
  { name: "🆓 NVIDIA: Nemotron Nano 9B V2 (Free)", value: "nvidia/nemotron-nano-9b-v2:free" },
  { name: "🆓 NVIDIA: Nemotron Nano 12B V2 VL (Free)", value: "nvidia/nemotron-nano-12b-v2-vl:free" },
  { name: "🆓 Xiaomi: MiMo-V2-Flash (Free)", value: "xiaomi/mimo-v2-flash:free" },
  { name: "🆓 Qwen: Qwen3 4B (Free)", value: "qwen/qwen3-4b:free" },
  { name: "🆓 Qwen: Qwen3 Coder (Free)", value: "qwen/qwen3-coder:free" },
  { name: "🆓 OpenAI: GPT-OSS 120B (Free)", value: "openai/gpt-oss-120b:free" },
  { name: "🆓 OpenAI: GPT-OSS 20B (Free)", value: "openai/gpt-oss-20b:free" },
  { name: "🆓 Z.AI: GLM 4.5 Air (Free)", value: "z-ai/glm-4.5-air:free" },
  { name: "🆓 Alibaba: Tongyi DeepResearch 30B (Free)", value: "alibaba/tongyi-deepresearch-30b-a3b:free" },
  { name: "🆓 Arcee AI: Trinity Mini (Free)", value: "arcee-ai/trinity-mini:free" },
  { name: "🆓 TNG: R1T Chimera (Free)", value: "tngtech/tng-r1t-chimera:free" },
  { name: "🆓 Nex AGI: DeepSeek V3.1 Nex N1 (Free)", value: "nex-agi/deepseek-v3.1-nex-n1:free" },
  { name: "🆓 Kwaipilot: KAT-Coder-Pro (Free)", value: "kwaipilot/kat-coder-pro:free" },

  // ═══════════════════════════════════════════════════════════════════
  // OPENAI MODELS
  // ═══════════════════════════════════════════════════════════════════
  { name: "OpenAI: GPT-5", value: "openai/gpt-5" },
  { name: "OpenAI: GPT-5 Pro", value: "openai/gpt-5-pro" },
  { name: "OpenAI: GPT-5 Mini", value: "openai/gpt-5-mini" },
  { name: "OpenAI: GPT-5 Nano", value: "openai/gpt-5-nano" },
  { name: "OpenAI: GPT-5 Codex", value: "openai/gpt-5-codex" },
  { name: "OpenAI: GPT-5.1", value: "openai/gpt-5.1" },
  { name: "OpenAI: GPT-5.1 Chat", value: "openai/gpt-5.1-chat" },
  { name: "OpenAI: GPT-5.1 Codex", value: "openai/gpt-5.1-codex" },
  { name: "OpenAI: GPT-5.1 Codex Max", value: "openai/gpt-5.1-codex-max" },
  { name: "OpenAI: GPT-5.1 Codex Mini", value: "openai/gpt-5.1-codex-mini" },
  { name: "OpenAI: GPT-5.2", value: "openai/gpt-5.2" },
  { name: "OpenAI: GPT-5.2 Chat", value: "openai/gpt-5.2-chat" },
  { name: "OpenAI: GPT-5.2 Pro", value: "openai/gpt-5.2-pro" },
  { name: "OpenAI: GPT-4.1", value: "openai/gpt-4.1" },
  { name: "OpenAI: GPT-4.1 Mini", value: "openai/gpt-4.1-mini" },
  { name: "OpenAI: GPT-4.1 Nano", value: "openai/gpt-4.1-nano" },
  { name: "OpenAI: GPT-4o 2024-11-20", value: "openai/gpt-4o-2024-11-20" },
  { name: "OpenAI: GPT-4o 2024-08-06", value: "openai/gpt-4o-2024-08-06" },
  { name: "OpenAI: GPT-4o 2024-05-13", value: "openai/gpt-4o-2024-05-13" },
  { name: "OpenAI: GPT-4o Extended", value: "openai/gpt-4o:extended" },
  { name: "OpenAI: GPT-4o Mini 2024-07-18", value: "openai/gpt-4o-mini-2024-07-18" },
  { name: "OpenAI: GPT-4o Audio Preview", value: "openai/gpt-4o-audio-preview" },
  { name: "OpenAI: GPT-4 Turbo", value: "openai/gpt-4-turbo" },
  { name: "OpenAI: GPT-4 Turbo Preview", value: "openai/gpt-4-turbo-preview" },
  { name: "OpenAI: GPT-4 Turbo 1106 Preview", value: "openai/gpt-4-1106-preview" },
  { name: "OpenAI: GPT-4", value: "openai/gpt-4" },
  { name: "OpenAI: GPT-4 0314", value: "openai/gpt-4-0314" },
  { name: "OpenAI: GPT-3.5 Turbo", value: "openai/gpt-3.5-turbo" },
  { name: "OpenAI: GPT-3.5 Turbo 16k", value: "openai/gpt-3.5-turbo-16k" },
  { name: "OpenAI: GPT-3.5 Turbo 0613", value: "openai/gpt-3.5-turbo-0613" },
  { name: "OpenAI: GPT-OSS 120B", value: "openai/gpt-oss-120b" },
  { name: "OpenAI: GPT-OSS 120B (Exacto)", value: "openai/gpt-oss-120b:exacto" },
  { name: "OpenAI: GPT-OSS 20B", value: "openai/gpt-oss-20b" },
  { name: "OpenAI: o1", value: "openai/o1" },
  { name: "OpenAI: o3", value: "openai/o3" },
  { name: "OpenAI: o3 Pro", value: "openai/o3-pro" },
  { name: "OpenAI: o3 Mini", value: "openai/o3-mini" },
  { name: "OpenAI: o3 Mini High", value: "openai/o3-mini-high" },
  { name: "OpenAI: o3 Deep Research", value: "openai/o3-deep-research" },
  { name: "OpenAI: o4 Mini", value: "openai/o4-mini" },
  { name: "OpenAI: o4 Mini High", value: "openai/o4-mini-high" },
  { name: "OpenAI: o4 Mini Deep Research", value: "openai/o4-mini-deep-research" },
  { name: "OpenAI: Codex Mini", value: "openai/codex-mini" },

  // ═══════════════════════════════════════════════════════════════════
  // ANTHROPIC MODELS
  // ═══════════════════════════════════════════════════════════════════
  { name: "Anthropic: Claude Opus 4.5", value: "anthropic/claude-opus-4.5" },
  { name: "Anthropic: Claude Opus 4.1", value: "anthropic/claude-opus-4.1" },
  { name: "Anthropic: Claude Opus 4", value: "anthropic/claude-opus-4" },
  { name: "Anthropic: Claude Sonnet 4.5", value: "anthropic/claude-sonnet-4.5" },
  { name: "Anthropic: Claude Haiku 4.5", value: "anthropic/claude-haiku-4.5" },
  { name: "Anthropic: Claude 3.7 Sonnet", value: "anthropic/claude-3.7-sonnet" },
  { name: "Anthropic: Claude 3.7 Sonnet (Thinking)", value: "anthropic/claude-3.7-sonnet:thinking" },
  { name: "Anthropic: Claude 3.5 Haiku", value: "anthropic/claude-3.5-haiku" },
  { name: "Anthropic: Claude 3.5 Haiku 2024-10-22", value: "anthropic/claude-3.5-haiku-20241022" },
  { name: "Anthropic: Claude 3 Opus", value: "anthropic/claude-3-opus" },
  { name: "Anthropic: Claude 3 Haiku", value: "anthropic/claude-3-haiku" },

  // ═══════════════════════════════════════════════════════════════════
  // GOOGLE MODELS
  // ═══════════════════════════════════════════════════════════════════
  { name: "Google: Gemini 3 Pro Preview", value: "google/gemini-3-pro-preview" },
  { name: "Google: Gemini 2.5 Pro", value: "google/gemini-2.5-pro" },
  { name: "Google: Gemini 2.5 Pro Preview 05-06", value: "google/gemini-2.5-pro-preview-05-06" },
  { name: "Google: Gemini 2.5 Flash Lite", value: "google/gemini-2.5-flash-lite" },
  { name: "Google: Gemini 2.5 Flash Preview 09-2025", value: "google/gemini-2.5-flash-preview-09-2025" },
  { name: "Google: Gemini 2.5 Flash Lite Preview 09-2025", value: "google/gemini-2.5-flash-lite-preview-09-2025" },
  { name: "Google: Gemini 2.0 Flash", value: "google/gemini-2.0-flash-001" },
  { name: "Google: Gemini 2.0 Flash Lite", value: "google/gemini-2.0-flash-lite-001" },
  { name: "Google: Gemma 3 27B", value: "google/gemma-3-27b-it" },

  // ═══════════════════════════════════════════════════════════════════
  // META LLAMA MODELS
  // ═══════════════════════════════════════════════════════════════════
  { name: "Meta: Llama 3.3 70B Instruct", value: "meta-llama/llama-3.3-70b-instruct" },
  { name: "Meta: Llama 3.2 3B Instruct", value: "meta-llama/llama-3.2-3b-instruct" },
  { name: "Meta: Llama 3.1 405B Instruct", value: "meta-llama/llama-3.1-405b-instruct" },
  { name: "Meta: Llama 3.1 70B Instruct", value: "meta-llama/llama-3.1-70b-instruct" },
  { name: "Meta: Llama 3.1 8B Instruct", value: "meta-llama/llama-3.1-8b-instruct" },
  { name: "Meta: Llama 3 70B Instruct", value: "meta-llama/llama-3-70b-instruct" },
  { name: "Meta: Llama 3 8B Instruct", value: "meta-llama/llama-3-8b-instruct" },

  // ═══════════════════════════════════════════════════════════════════
  // DEEPSEEK MODELS
  // ═══════════════════════════════════════════════════════════════════
  { name: "DeepSeek: DeepSeek V3.2", value: "deepseek/deepseek-v3.2" },
  { name: "DeepSeek: DeepSeek V3.2 Exp", value: "deepseek/deepseek-v3.2-exp" },
  { name: "DeepSeek: DeepSeek V3.1", value: "deepseek/deepseek-chat-v3.1" },
  { name: "DeepSeek: DeepSeek V3.1 Terminus", value: "deepseek/deepseek-v3.1-terminus" },
  { name: "DeepSeek: DeepSeek V3.1 Terminus (Exacto)", value: "deepseek/deepseek-v3.1-terminus:exacto" },
  { name: "DeepSeek: DeepSeek Chat V3 0324", value: "deepseek/deepseek-chat-v3-0324" },
  { name: "DeepSeek: DeepSeek R1 0528", value: "deepseek/deepseek-r1-0528" },
  { name: "DeepSeek: DeepSeek R1 Distill Llama 70B", value: "deepseek/deepseek-r1-distill-llama-70b" },

  // ═══════════════════════════════════════════════════════════════════
  // MISTRAL MODELS
  // ═══════════════════════════════════════════════════════════════════
  { name: "Mistral: Mistral Large 2512", value: "mistralai/mistral-large-2512" },
  { name: "Mistral: Mistral Large 2411", value: "mistralai/mistral-large-2411" },
  { name: "Mistral: Mistral Large 2407", value: "mistralai/mistral-large-2407" },
  { name: "Mistral: Mistral Large", value: "mistralai/mistral-large" },
  { name: "Mistral: Mistral Medium 3.1", value: "mistralai/mistral-medium-3.1" },
  { name: "Mistral: Mistral Medium 3", value: "mistralai/mistral-medium-3" },
  { name: "Mistral: Mistral Small 3.2 24B", value: "mistralai/mistral-small-3.2-24b-instruct" },
  { name: "Mistral: Mistral Small 3.1 24B", value: "mistralai/mistral-small-3.1-24b-instruct" },
  { name: "Mistral: Mistral Small 24B 2501", value: "mistralai/mistral-small-24b-instruct-2501" },
  { name: "Mistral: Mistral Small Creative", value: "mistralai/mistral-small-creative" },
  { name: "Mistral: Mistral Nemo", value: "mistralai/mistral-nemo" },
  { name: "Mistral: Mistral Saba", value: "mistralai/mistral-saba" },
  { name: "Mistral: Mistral Tiny", value: "mistralai/mistral-tiny" },
  { name: "Mistral: Mistral 7B Instruct", value: "mistralai/mistral-7b-instruct" },
  { name: "Mistral: Ministral 14B 2512", value: "mistralai/ministral-14b-2512" },
  { name: "Mistral: Ministral 8B 2512", value: "mistralai/ministral-8b-2512" },
  { name: "Mistral: Ministral 8B", value: "mistralai/ministral-8b" },
  { name: "Mistral: Ministral 3B 2512", value: "mistralai/ministral-3b-2512" },
  { name: "Mistral: Ministral 3B", value: "mistralai/ministral-3b" },
  { name: "Mistral: Codestral 2508", value: "mistralai/codestral-2508" },
  { name: "Mistral: Devstral Medium", value: "mistralai/devstral-medium" },
  { name: "Mistral: Devstral Small", value: "mistralai/devstral-small" },
  { name: "Mistral: Devstral 2512", value: "mistralai/devstral-2512" },
  { name: "Mistral: Pixtral Large 2411", value: "mistralai/pixtral-large-2411" },
  { name: "Mistral: Pixtral 12B", value: "mistralai/pixtral-12b" },
  { name: "Mistral: Mixtral 8x22B", value: "mistralai/mixtral-8x22b-instruct" },
  { name: "Mistral: Mixtral 8x7B", value: "mistralai/mixtral-8x7b-instruct" },
  { name: "Mistral: Voxtral Small 24B", value: "mistralai/voxtral-small-24b-2507" },

  // ═══════════════════════════════════════════════════════════════════
  // XAI GROK MODELS
  // ═══════════════════════════════════════════════════════════════════
  { name: "xAI: Grok 4", value: "x-ai/grok-4" },
  { name: "xAI: Grok 4 Fast", value: "x-ai/grok-4-fast" },
  { name: "xAI: Grok 4.1 Fast", value: "x-ai/grok-4.1-fast" },
  { name: "xAI: Grok 3 Beta", value: "x-ai/grok-3-beta" },
  { name: "xAI: Grok 3 Mini Beta", value: "x-ai/grok-3-mini-beta" },
  { name: "xAI: Grok Code Fast 1", value: "x-ai/grok-code-fast-1" },

  // ═══════════════════════════════════════════════════════════════════
  // QWEN MODELS
  // ═══════════════════════════════════════════════════════════════════
  { name: "Qwen: Qwen3 Max", value: "qwen/qwen3-max" },
  { name: "Qwen: Qwen3 235B A22B", value: "qwen/qwen3-235b-a22b" },
  { name: "Qwen: Qwen3 235B A22B 2507", value: "qwen/qwen3-235b-a22b-2507" },
  { name: "Qwen: Qwen3 235B A22B Thinking 2507", value: "qwen/qwen3-235b-a22b-thinking-2507" },
  { name: "Qwen: Qwen3 32B", value: "qwen/qwen3-32b" },
  { name: "Qwen: Qwen3 30B A3B", value: "qwen/qwen3-30b-a3b" },
  { name: "Qwen: Qwen3 30B A3B Instruct 2507", value: "qwen/qwen3-30b-a3b-instruct-2507" },
  { name: "Qwen: Qwen3 30B A3B Thinking 2507", value: "qwen/qwen3-30b-a3b-thinking-2507" },
  { name: "Qwen: Qwen3 14B", value: "qwen/qwen3-14b" },
  { name: "Qwen: Qwen3 8B", value: "qwen/qwen3-8b" },
  { name: "Qwen: Qwen3 Next 80B A3B Instruct", value: "qwen/qwen3-next-80b-a3b-instruct" },
  { name: "Qwen: Qwen3 Next 80B A3B Thinking", value: "qwen/qwen3-next-80b-a3b-thinking" },
  { name: "Qwen: Qwen3 Coder", value: "qwen/qwen3-coder" },
  { name: "Qwen: Qwen3 Coder Plus", value: "qwen/qwen3-coder-plus" },
  { name: "Qwen: Qwen3 Coder Flash", value: "qwen/qwen3-coder-flash" },
  { name: "Qwen: Qwen3 Coder 30B A3B Instruct", value: "qwen/qwen3-coder-30b-a3b-instruct" },
  { name: "Qwen: Qwen3 Coder (Exacto)", value: "qwen/qwen3-coder:exacto" },
  { name: "Qwen: Qwen3 VL 235B A22B Instruct", value: "qwen/qwen3-vl-235b-a22b-instruct" },
  { name: "Qwen: Qwen3 VL 235B A22B Thinking", value: "qwen/qwen3-vl-235b-a22b-thinking" },
  { name: "Qwen: Qwen3 VL 30B A3B Instruct", value: "qwen/qwen3-vl-30b-a3b-instruct" },
  { name: "Qwen: Qwen3 VL 30B A3B Thinking", value: "qwen/qwen3-vl-30b-a3b-thinking" },
  { name: "Qwen: Qwen3 VL 8B Instruct", value: "qwen/qwen3-vl-8b-instruct" },
  { name: "Qwen: Qwen3 VL 8B Thinking", value: "qwen/qwen3-vl-8b-thinking" },
  { name: "Qwen: Qwen 2.5 72B Instruct", value: "qwen/qwen-2.5-72b-instruct" },
  { name: "Qwen: Qwen Max", value: "qwen/qwen-max" },
  { name: "Qwen: Qwen Plus", value: "qwen/qwen-plus" },
  { name: "Qwen: Qwen Plus 0728", value: "qwen/qwen-plus-2025-07-28" },
  { name: "Qwen: Qwen Plus 0728 (Thinking)", value: "qwen/qwen-plus-2025-07-28:thinking" },
  { name: "Qwen: Qwen Turbo", value: "qwen/qwen-turbo" },
  { name: "Qwen: Qwen VL Max", value: "qwen/qwen-vl-max" },
  { name: "Qwen: QwQ 32B", value: "qwen/qwq-32b" },

  // ═══════════════════════════════════════════════════════════════════
  // MICROSOFT MODELS
  // ═══════════════════════════════════════════════════════════════════
  { name: "Microsoft: Phi-3.5 Mini 128K Instruct", value: "microsoft/phi-3.5-mini-128k-instruct" },
  { name: "Microsoft: Phi-3 Mini 128K Instruct", value: "microsoft/phi-3-mini-128k-instruct" },
  { name: "Microsoft: Phi-3 Medium 128K Instruct", value: "microsoft/phi-3-medium-128k-instruct" },

  // ═══════════════════════════════════════════════════════════════════
  // NVIDIA MODELS
  // ═══════════════════════════════════════════════════════════════════
  { name: "NVIDIA: Llama 3.3 Nemotron Super 49B v1.5", value: "nvidia/llama-3.3-nemotron-super-49b-v1.5" },
  { name: "NVIDIA: Llama 3.1 Nemotron 70B Instruct", value: "nvidia/llama-3.1-nemotron-70b-instruct" },
  { name: "NVIDIA: Nemotron 3 Nano 30B A3B", value: "nvidia/nemotron-3-nano-30b-a3b" },
  { name: "NVIDIA: Nemotron Nano 9B V2", value: "nvidia/nemotron-nano-9b-v2" },

  // ═══════════════════════════════════════════════════════════════════
  // COHERE MODELS
  // ═══════════════════════════════════════════════════════════════════
  { name: "Cohere: Command R+ 08-2024", value: "cohere/command-r-plus-08-2024" },
  { name: "Cohere: Command R 08-2024", value: "cohere/command-r-08-2024" },

  // ═══════════════════════════════════════════════════════════════════
  // AMAZON MODELS
  // ═══════════════════════════════════════════════════════════════════
  { name: "Amazon: Nova Premier", value: "amazon/nova-premier-v1" },
  { name: "Amazon: Nova 2 Lite", value: "amazon/nova-2-lite-v1" },
  { name: "Amazon: Nova Pro", value: "amazon/nova-pro-v1" },
  { name: "Amazon: Nova Lite", value: "amazon/nova-lite-v1" },
  { name: "Amazon: Nova Micro", value: "amazon/nova-micro-v1" },

  // ═══════════════════════════════════════════════════════════════════
  // AI21 MODELS
  // ═══════════════════════════════════════════════════════════════════
  { name: "AI21: Jamba Large 1.7", value: "ai21/jamba-large-1.7" },
  { name: "AI21: Jamba Mini 1.7", value: "ai21/jamba-mini-1.7" },

  // ═══════════════════════════════════════════════════════════════════
  // OTHER MODELS WITH TOOL SUPPORT
  // ═══════════════════════════════════════════════════════════════════
  { name: "Z.AI: GLM 4.7", value: "z-ai/glm-4.7" },
  { name: "Z.AI: GLM 4.6", value: "z-ai/glm-4.6" },
  { name: "Z.AI: GLM 4.6 (Exacto)", value: "z-ai/glm-4.6:exacto" },
  { name: "Z.AI: GLM 4.6V", value: "z-ai/glm-4.6v" },
  { name: "Z.AI: GLM 4.5", value: "z-ai/glm-4.5" },
  { name: "Z.AI: GLM 4.5 Air", value: "z-ai/glm-4.5-air" },
  { name: "Z.AI: GLM 4.5V", value: "z-ai/glm-4.5v" },
  { name: "Z.AI: GLM 4 32B", value: "z-ai/glm-4-32b" },
  { name: "Moonshot: Kimi K2", value: "moonshotai/kimi-k2" },
  { name: "Moonshot: Kimi K2 0905", value: "moonshotai/kimi-k2-0905" },
  { name: "Moonshot: Kimi K2 0905 (Exacto)", value: "moonshotai/kimi-k2-0905:exacto" },
  { name: "Moonshot: Kimi K2 Thinking", value: "moonshotai/kimi-k2-thinking" },
  { name: "MiniMax: MiniMax M2", value: "minimax/minimax-m2" },
  { name: "MiniMax: MiniMax M1", value: "minimax/minimax-m1" },
  { name: "Inception: Mercury", value: "inception/mercury" },
  { name: "Inception: Mercury Coder", value: "inception/mercury-coder" },
  { name: "NousResearch: Hermes 4 405B", value: "nousresearch/hermes-4-405b" },
  { name: "NousResearch: Hermes 4 70B", value: "nousresearch/hermes-4-70b" },
  { name: "NousResearch: DeepHermes 3 Mistral 24B Preview", value: "nousresearch/deephermes-3-mistral-24b-preview" },
  { name: "DeepCogito: Cogito V2 Preview Llama 405B", value: "deepcogito/cogito-v2-preview-llama-405b" },
  { name: "DeepCogito: Cogito V2 Preview Llama 109B MoE", value: "deepcogito/cogito-v2-preview-llama-109b-moe" },
  { name: "DeepCogito: Cogito V2 Preview Llama 70B", value: "deepcogito/cogito-v2-preview-llama-70b" },
  { name: "Baidu: ERNIE 4.5 21B A3B", value: "baidu/ernie-4.5-21b-a3b" },
  { name: "Baidu: ERNIE 4.5 VL 28B A3B", value: "baidu/ernie-4.5-vl-28b-a3b" },
  { name: "StepFun: Step3", value: "stepfun-ai/step3" },
  { name: "Prime Intellect: Intellect 3", value: "prime-intellect/intellect-3" },
  { name: "Arcee AI: Virtuoso Large", value: "arcee-ai/virtuoso-large" },
  { name: "Arcee AI: Trinity Mini", value: "arcee-ai/trinity-mini" },
  { name: "Alibaba: Tongyi DeepResearch 30B A3B", value: "alibaba/tongyi-deepresearch-30b-a3b" },
  { name: "Sao10k: L3 Euryale 70B", value: "sao10k/l3-euryale-70b" },
  { name: "Sao10k: L3.1 Euryale 70B", value: "sao10k/l3.1-euryale-70b" },
  { name: "TheDrummer: Rocinante 12B", value: "thedrummer/rocinante-12b" },
  { name: "TheDrummer: UnslopNemo 12B", value: "thedrummer/unslopnemo-12b" },
  { name: "AllenAI: Olmo 3 7B Instruct", value: "allenai/olmo-3-7b-instruct" },
  { name: "TNG: DeepSeek R1T2 Chimera", value: "tngtech/deepseek-r1t2-chimera" },
  { name: "TNG: R1T Chimera", value: "tngtech/tng-r1t-chimera" },
  { name: "Relace: Relace Search", value: "relace/relace-search" },
];

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
            url: "https://www.agnic.ai/ai-gateway",
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
        options: SUPPORTED_MODELS,
        default: "openai/gpt-4o-mini",
        description:
          "Select a model from the list below or type a custom model ID. ⭐ = Recommended, 🆓 = Free tier.",
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
        "Model must be specified. Select from dropdown or enter a custom model ID.",
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
        baseURL: "https://api.agnic.ai/v1",
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
