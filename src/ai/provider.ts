import OpenAI from "openai";
import type { AIConfig } from "./config";
import { getAIApiKey } from "./config";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  temperature?: number;
  max_tokens?: number;
  model?: string;
}

export interface AIProvider {
  chatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<string>;
  streamChatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): AsyncGenerator<string, void, unknown>;
}

function getBaseUrl(provider: AIConfig["provider"]): string {
  switch (provider) {
    case "xai":
      return "https://api.x.ai/v1";
    case "openai":
      return "https://api.openai.com/v1";
    case "anthropic":
      return "https://api.anthropic.com/v1";
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
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

export async function createAIProvider(config: AIConfig): Promise<AIProvider> {
  const apiKey = await getAIApiKey(config.provider);

  const client = new OpenAI({
    apiKey,
    baseURL: getBaseUrl(config.provider),
  });

  const defaultModel = config.model || getDefaultModel(config.provider);
  const defaultTemperature = config.temperature ?? 0.7;
  const defaultMaxTokens = config.max_tokens ?? 2048;

  return {
    async chatCompletion(
      messages: ChatMessage[],
      options?: ChatCompletionOptions
    ): Promise<string> {
      const response = await client.chat.completions.create({
        model: options?.model || defaultModel,
        messages,
        temperature: options?.temperature ?? defaultTemperature,
        max_tokens: options?.max_tokens ?? defaultMaxTokens,
      });

      return response.choices[0]?.message?.content || "";
    },

    async *streamChatCompletion(
      messages: ChatMessage[],
      options?: ChatCompletionOptions
    ): AsyncGenerator<string, void, unknown> {
      const stream = await client.chat.completions.create({
        model: options?.model || defaultModel,
        messages,
        temperature: options?.temperature ?? defaultTemperature,
        max_tokens: options?.max_tokens ?? defaultMaxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    },
  };
}
