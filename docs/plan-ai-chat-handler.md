# AI Chat Handler — Implementation Plan

**Package:** @musekit/services  
**Issue:** #21 — AI Chat Handler Function  
**Priority:** Medium

---

## What is being built

A new server-side function called `handleChatMessage()` that serves as the bridge between API routes and the AI provider. Instead of each API route needing to load config, create a provider, build messages, and handle errors, this single function does all of that. The API route just calls `handleChatMessage({ message: "Hello" })` and gets back a response.

---

## New file: `src/ai/chat-handler.ts`

This file introduces two interfaces and one function:

- **ChatRequest** — The input: a `message` string, optional `history` array of previous messages, and an optional `systemPrompt` override.
- **ChatResponse** — The output: the AI's `reply`, plus which `provider` and `model` were used.
- **handleChatMessage()** — The function that does the work.

### How it works step by step

1. Loads the current AI configuration from Supabase (provider, model, temperature, etc.)
2. Checks if an API key exists for the configured provider
3. If no key is found, returns a friendly message telling the user to configure one — no crash
4. Creates the AI provider using the existing `createAIProvider()` function
5. Builds the message array: system prompt first, then any conversation history, then the new user message
6. Calls the provider's `chatCompletion()` method
7. Returns the reply along with which provider and model were used
8. If the AI call itself fails (network issue, rate limit, bad key), catches the error and returns a helpful fallback message instead of crashing

### Error scenarios handled

| Scenario | Behavior |
|---|---|
| Config can't load from DB | Falls back to defaults (xAI Grok) |
| No API key configured | Returns friendly "not configured" message |
| AI provider call fails | Returns "try again" message, logs error to console |

---

## Files changed

| File | Change |
|---|---|
| `src/ai/chat-handler.ts` | New file — the handler function |
| `src/ai/index.ts` | Add export for `handleChatMessage`, `ChatRequest`, `ChatResponse` |
| `src/index.ts` | Add export for `handleChatMessage`, `ChatRequest`, `ChatResponse` |

---

## What is NOT changing

- No new npm dependencies
- No changes to the existing AI provider, config, or help widget code
- No Next.js dependencies introduced
- No changes to notifications, webhooks, or jobs subsystems

---

## How to verify it works

After building, TypeScript compilation (`tsc --noEmit`) should pass cleanly. The function can be tested by setting the `XAI_API_KEY` environment variable and calling `handleChatMessage({ message: "Hello" })` from a test script.
