export { createAIProvider } from "./provider";
export type { AIProvider, ChatMessage, ChatCompletionOptions } from "./provider";

export { getAIConfig, updateAIConfig, getAIApiKey } from "./config";
export type { AIConfig } from "./config";

export { handleChatMessage } from "./chat-handler";
export type { ChatRequest, ChatResponse } from "./chat-handler";

export { HelpWidget } from "./help-widget";
