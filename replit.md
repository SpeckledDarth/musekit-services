# @musekit/services

## Overview
Standalone npm package bundling four backend subsystems for the MuseKit SaaS platform: notifications, webhooks, AI provider, and background jobs.

## Tech Stack
- TypeScript (strict mode)
- Node.js 20
- React 18.3.1 (peer dependency for components)
- Supabase (database client via @musekit/database)
- BullMQ + Upstash Redis (background jobs and rate limiting)
- OpenAI SDK (AI provider abstraction for xAI/OpenAI/Anthropic)

## Project Structure
```
src/
├── index.ts                   # Main entry point — re-exports all subsystems
├── notifications/
│   ├── index.ts               # Notification exports
│   ├── server.ts              # Server-side CRUD (createNotification, getUnreadCount, etc.)
│   └── components.tsx         # NotificationBell + NotificationPopover React components
├── webhooks/
│   ├── index.ts               # Webhook exports
│   ├── config.ts              # Webhook configuration CRUD
│   └── dispatcher.ts          # HMAC-SHA256 signed webhook dispatch with retry
├── ai/
│   ├── index.ts               # AI exports
│   ├── chat-handler.ts        # Server-side chat orchestrator (handleChatMessage)
│   ├── config.ts              # AI provider config CRUD + API key lookup
│   ├── provider.ts            # Pluggable AI provider factory (xAI, OpenAI, Anthropic)
│   └── help-widget.tsx        # HelpWidget React component with NPS rating
├── jobs/
│   ├── index.ts               # Jobs exports
│   ├── queue.ts               # BullMQ queue setup with Upstash Redis
│   ├── processors.ts          # 6 job processors (email, webhook retry, reports, etc.)
│   └── rate-limiter.ts        # Sliding window rate limiter with in-memory fallback
packages/
├── musekit-shared/            # @musekit/shared — types, utils, config
└── musekit-database/          # @musekit/database — Supabase client, schema types, queries
scripts/
└── dev-server.js              # Dev dashboard server (port 5000)
```

## Commands
- `npm run build` — Compile TypeScript to dist/
- `npm run dev` — Start dev dashboard on port 5000
- `npm run typecheck` — Type-check without emitting
- `npm run clean` — Remove dist/

## Environment Variables (all configured as secrets)
- `XAI_API_KEY` — xAI Grok API key
- `UPSTASH_REDIS_REST_URL` — Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis REST token
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key

## Dependencies
- `@musekit/shared` (file: local from packages/musekit-shared)
- `@musekit/database` (file: local from packages/musekit-database)
- `bullmq`, `@upstash/redis`, `openai`, `lucide-react`, `@supabase/supabase-js`
