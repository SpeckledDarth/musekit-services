# @musekit/services

## Overview
Standalone npm package bundling four backend subsystems for the MuseKit SaaS platform: notifications, webhooks, AI provider, and background jobs. Includes admin UI components for webhook management and job monitoring.

## Tech Stack
- TypeScript (strict mode)
- Node.js 20
- React 18.3.1 (peer dependency for components)
- Supabase (database client via @musekit/database)
- BullMQ + Upstash Redis (background jobs and rate limiting)
- OpenAI SDK (AI provider abstraction for xAI/OpenAI/Anthropic)
- Resend (email delivery)
- Sonner (toast notifications in UI components)

## Project Structure
```
src/
├── index.ts                   # Main entry point — re-exports all subsystems (server + client)
├── components.ts              # Client-safe entry point — React components ONLY (no BullMQ/Node.js)
├── ui/
│   ├── index.ts               # UI exports
│   ├── components.tsx         # Shared UI primitives (ConfirmDialog, Skeleton, Pagination, etc.)
│   └── utils.ts               # Client utilities (relativeTime, CSV export, URL validation, etc.)
├── notifications/
│   ├── index.ts               # Notification exports
│   ├── server.ts              # Server-side CRUD (createNotification, getUnreadCount, etc.)
│   └── components.tsx         # NotificationBell + NotificationPopover React components
├── webhooks/
│   ├── index.ts               # Webhook exports
│   ├── events.ts              # Webhook event constants (client-safe)
│   ├── config.ts              # Webhook configuration CRUD (settings table)
│   ├── dispatcher.ts          # HMAC-SHA256 signed webhook dispatch with BullMQ retries
│   └── components/
│       ├── index.ts           # Component barrel exports
│       ├── WebhookList.tsx    # Webhook list with search, filters, bulk ops, CSV export
│       ├── WebhookEditor.tsx  # Create/edit webhook form with validation
│       └── WebhookDetail.tsx  # Webhook detail with delivery history, test, retry
├── ai/
│   ├── index.ts               # AI exports
│   ├── chat-handler.ts        # Server-side chat orchestrator (handleChatMessage)
│   ├── config.ts              # AI provider config CRUD + API key lookup (settings/config_secrets)
│   ├── provider.ts            # Pluggable AI provider factory (xAI, OpenAI, Anthropic)
│   └── help-widget.tsx        # HelpWidget React component with NPS rating
├── jobs/
│   ├── index.ts               # Jobs exports
│   ├── queue.ts               # BullMQ queue setup with Upstash Redis
│   ├── processors.ts          # 6 job processors (email via Resend, webhook retry, reports, etc.)
│   ├── rate-limiter.ts        # Sliding window rate limiter with in-memory fallback
│   └── components/
│       ├── index.ts           # Component barrel exports
│       ├── JobDashboard.tsx   # Job overview cards, type breakdown, failure table
│       └── JobDetail.tsx      # Job detail with data viewer, error trace, attempt history
packages/
├── musekit-shared/            # @musekit/shared — types, utils, config
└── musekit-database/          # @musekit/database — Supabase client, schema types, queries
scripts/
└── dev-server.js              # Dev dashboard server (port 5000)
```

## Entry Points
- `@musekit/services` — Full package (server + client, includes BullMQ/Node.js deps)
- `@musekit/services/components` — Client-safe React components only (no server deps)

## Commands
- `npm run build` — Compile TypeScript to dist/
- `npm run dev` — Start dev dashboard on port 5000
- `npm run typecheck` — Type-check without emitting
- `npm run clean` — Remove dist/

## Database Table Mapping
Code references map to real Supabase tables as follows:
- `settings` — key/value config store (AI config, webhook config, feature flags)
- `config_secrets` — encrypted API keys (columns: id, key_name, encrypted_value, updated_at, updated_by)
- `muse_product_subscriptions` — subscription data (NOT "subscriptions")
- `profiles` — user profiles
- `audit_logs` — audit trail (correct as-is)
- `notifications` — notification records (correct as-is)
- Tables that do NOT exist: `feature_toggles`, `api_keys`, `webhook_configs`

## UI Component Pattern
All admin UI components use callback function props for server-side actions (same pattern as NotificationBell). The consuming app wires API routes to these callbacks. Components use:
- `"use client"` directive
- Tailwind CSS with dark mode (`dark:` classes)
- Sonner for toast notifications
- STANDARD E UX patterns (skeletons, empty states, pagination, CSV export, bulk ops, breadcrumbs, confirmation dialogs, form validation, relative timestamps)

## Environment Variables (all configured as secrets)
- `XAI_API_KEY` — xAI Grok API key
- `RESEND_API_KEY` — Resend email delivery API key
- `UPSTASH_REDIS_REST_URL` — Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis REST token
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key

## Dependencies
- `@musekit/shared` (file: local from packages/musekit-shared)
- `@musekit/database` (file: local from packages/musekit-database)
- `bullmq`, `@upstash/redis`, `openai`, `resend`, `sonner`, `lucide-react`, `@supabase/supabase-js`
