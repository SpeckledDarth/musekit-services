import React, { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Star, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface HelpWidgetProps {
  systemPrompt?: string;
  fallbackEmail?: string;
  onSendMessage: (messages: { role: string; content: string }[]) => Promise<string>;
  onNpsRating?: (rating: number, sessionId: string) => void;
  enabled?: boolean;
}

export function HelpWidget({
  systemPrompt = "You are a helpful support assistant.",
  fallbackEmail = "support@example.com",
  onSendMessage,
  onNpsRating,
  enabled = true,
}: HelpWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNps, setShowNps] = useState(false);
  const [npsRating, setNpsRating] = useState<number | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const response = await onSendMessage(apiMessages);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);

      if (!showNps && updatedMessages.filter((m) => m.role === "user").length >= 2) {
        setShowNps(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I'm sorry, I couldn't process your request. Please contact us at ${fallbackEmail} for further assistance.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, systemPrompt, onSendMessage, fallbackEmail, showNps]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleNpsClick = useCallback(
    (rating: number) => {
      setNpsRating(rating);
      onNpsRating?.(rating, sessionId);
    },
    [onNpsRating, sessionId]
  );

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-80 sm:w-96 h-[500px] bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
            <h3 className="text-sm font-semibold">Help & Support</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
              aria-label="Close help widget"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-sm text-gray-500 mt-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>How can we help you today?</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {showNps && npsRating === null && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-600 mb-1">
                How helpful was this? Rate 1-5:
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleNpsClick(rating)}
                    className="p-1 hover:text-yellow-500 text-gray-300 transition-colors"
                    aria-label={`Rate ${rating} stars`}
                  >
                    <Star className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {npsRating !== null && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-600">
                Thanks for your feedback! ({npsRating}/5)
              </p>
            </div>
          )}

          <div className="p-3 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors hover:scale-105"
          aria-label="Open help widget"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
