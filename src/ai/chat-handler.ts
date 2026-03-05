import { getAIConfig, getAIApiKey } from "./config";
import { createAIProvider } from "./provider";
import type { ChatMessage } from "./provider";
import type { AIConfig } from "./config";

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  systemPrompt?: string;
}

export interface ChatResponse {
  reply: string;
  provider: string;
  model: string;
}

function getDefaultModel(provider: AIConfig["provider"]): string {
  switch (provider) {
    case "xai":
      return "grok-3";
    case "openai":
      return "gpt-4o";
    case "anthropic":
      return "claude-sonnet-4-20250514";
    default:
      return "gpt-4o";
  }
}

export async function handleChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  let config: AIConfig;

  try {
    config = await getAIConfig();
  } catch (error) {
    console.error("[chat-handler] Failed to load AI config, using defaults:", error);
    config = {
      provider: "xai",
      model: "grok-3",
      temperature: 0.7,
      max_tokens: 2048,
      system_prompt: "You are a helpful assistant.",
    };
  }

  const model = config.model || getDefaultModel(config.provider);

  try {
    await getAIApiKey(config.provider);
  } catch {
    return {
      reply:
        "AI chat is not configured yet. Please ask an administrator to add an AI API key in the admin settings.",
      provider: "none",
      model: "none",
    };
  }

  try {
    const provider = await createAIProvider(config);

    const systemPrompt =
      request.systemPrompt ||
      config.system_prompt ||
      "You are a helpful support assistant for a SaaS application.";

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...(request.history || []),
      { role: "user", content: request.message },
    ];

    const reply = await provider.chatCompletion(messages);

    return {
      reply,
      provider: config.provider,
      model,
    };
  } catch (error) {
    console.error(
      `[chat-handler] AI provider call failed — provider=${config.provider} model=${model}:`,
      error instanceof Error ? error.message : error
    );

    return {
      reply:
        "I'm having trouble connecting right now. Please try again in a moment, or contact support if the issue persists.",
      provider: config.provider,
      model,
    };
  }
}
