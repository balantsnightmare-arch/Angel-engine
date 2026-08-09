import { CouncilNodeConfig, ModelOption } from "../types";

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    provider: "Google Gemini",
    description: "Ultra-fast response with balanced reasoning accuracy",
    badge: "FAST",
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "Google Gemini",
    description: "Maximum analytical intelligence and long-context reasoning",
    badge: "ADVANCED PRO",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "Google Gemini",
    description: "Deep structured analysis & massive context capability",
    badge: "LONG CONTEXT",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o Omni Core",
    provider: "OpenAI Persona",
    description: "High-capability multimodal reasoning and logical synthesis",
    badge: "ADVANCED OMNI",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI Persona",
    description: "Lightweight, responsive logic core for rapid analysis",
    badge: "FAST MINI",
  },
  {
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic Persona",
    description: "Highly articulate, structured, and nuanced logic core",
    badge: "SONNET 3.5",
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic Persona",
    description: "Deep, comprehensive philosophical persona & high rigor",
    badge: "OPUS HIGH",
  },
  {
    id: "claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic Persona",
    description: "Crisp, ultra-concise rapid execution persona",
    badge: "HAIKU",
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek Persona",
    description: "Specialized step-by-step chain-of-thought mathematical logic",
    badge: "REASONING",
  },
  {
    id: "llama-3.3-70b",
    name: "Llama 3.3 70B",
    provider: "Meta Persona",
    description: "Open-weight high-tier strategic reasoning and synthesis",
    badge: "OPEN 70B",
  },
  {
    id: "mistral-large",
    name: "Mistral Large 2",
    provider: "Mistral AI Persona",
    description: "Precise instruction-following and code-level logic",
    badge: "MISTRAL V2",
  },
  {
    id: "custom",
    name: "Custom Instruction Persona",
    provider: "Custom",
    description: "Fully customizable system instructions and directives",
    badge: "CUSTOM",
  },
  {
    id: "ollama-llama3.3",
    name: "Llama 3.3",
    provider: "Ollama (Local)",
    description: "Meta's Llama 3.3 running locally via Ollama — no content filters",
    badge: "LOCAL",
  },
  {
    id: "ollama-mistral",
    name: "Mistral 7B",
    provider: "Ollama (Local)",
    description: "Mistral 7B running locally via Ollama — fast and uncensored",
    badge: "LOCAL",
  },
  {
    id: "ollama-dolphin-mistral",
    name: "Dolphin Mistral",
    provider: "Ollama (Local)",
    description: "Uncensored Dolphin fine-tune of Mistral — no safety filters",
    badge: "UNCENSORED",
  },
  {
    id: "ollama-qwen2.5",
    name: "Qwen 2.5",
    provider: "Ollama (Local)",
    description: "Alibaba's Qwen 2.5 running locally via Ollama",
    badge: "LOCAL",
  },
  {
    id: "ollama-phi4",
    name: "Phi-4",
    provider: "Ollama (Local)",
    description: "Microsoft's Phi-4 — small but powerful, runs on modest hardware",
    badge: "LOCAL SMALL",
  },
];

export const NORMAL_MODE_MODELS: Record<string, any> = {
  node1: "gemini-3.6-flash",
  node2: "claude-3.5-sonnet",
  node3: "gpt-4o",
};

export const ADVANCED_MODE_MODELS: Record<string, any> = {
  node1: "gemini-3.1-pro-preview",
  node2: "claude-3-opus",
  node3: "deepseek-r1",
};

export const DEFAULT_NODES: CouncilNodeConfig[] = [
  {
    id: "node1",
    codeName: "GAMBIT",
    archetype: "Logical - Pure Logic, Zero Morality",
    modelId: "gemini-3.6-flash",
    temperature: 0.3,
    colorHex: "#a855f7",
    accentBg: "rgba(168, 85, 247, 0.15)",
  },
  {
    id: "node2",
    codeName: "MELANCHOLY",
    archetype: "Moral - Pure Ethics, Zero Logic",
    modelId: "claude-3.5-sonnet",
    temperature: 0.5,
    colorHex: "#c084fc",
    accentBg: "rgba(192, 132, 252, 0.15)",
  },
  {
    id: "node3",
    codeName: "NULL",
    archetype: "Philosophical - Pure Existentialism, Zero Morals or Logic",
    modelId: "gpt-4o",
    temperature: 0.7,
    colorHex: "#7c3aed",
    accentBg: "rgba(124, 58, 237, 0.15)",
  },
];

export const PRESET_TOPICS = [
  {
    category: "AI & Technology Ethics",
    topics: [
      "How should society regulate and govern frontier autonomous AI decision-making systems?",
      "Is open-sourcing advanced AI model weights safer than closed-access deployment?",
      "Should autonomous vehicles prioritize passenger safety or pedestrian safety in unavoidable accidents?",
    ],
  },
  {
    category: "Software Engineering & Architecture",
    topics: [
      "Should enterprise microservices transition back to modular monoliths for reduced operational overhead?",
      "Is strict event-driven architecture superior to REST APIs for high-scale financial systems?",
      "Will AI code generation fundamentally shift software engineering from coding to systemic verification?",
    ],
  },
  {
    category: "Philosophy & Human Policy",
    topics: [
      "Is Universal Basic Income the most resilient economic safeguard against technological automation?",
      "Should nuclear fusion energy receive prioritized public funding over current renewable storage tech?",
      "How can international space law prevent orbital clutter while encouraging lunar and planetary exploration?",
    ],
  },
];
