# @musekit/services

Backend services package for the MuseKit SaaS platform. Bundles four subsystems: notifications, webhooks, AI provider, and background jobs.

## Subsystems

### Notifications (`src/notifications/`)
- **Server**: `createNotification`, `getUnreadCount`, `markAllRead`, `getNotifications`
- **Components**: `NotificationBell` — bell icon with unread count badge and popover

### Webhooks (`src/webhooks/`)
- **Dispatcher**: `dispatchWebhook` — fire-and-forget with HMAC-SHA256 signing and 3x retry
- **Config**: `getWebhookConfig`, `updateWebhookConfig`, `validateWebhookUrl`
- **Events**: feedback_submitted, waitlist_entry, subscription_created/updated/canceled, team_invitation_sent, team_member_joined, contact_form_submitted

### AI Provider (`src/ai/`)
- **Provider**: `createAIProvider` — pluggable factory supporting xAI Grok, OpenAI, Anthropic
- **Methods**: `chatCompletion` (non-streaming), `streamChatCompletion` (streaming)
- **Config**: `getAIConfig`, `updateAIConfig`, `getAIApiKey`
- **Components**: `HelpWidget` — floating AI chat with NPS rating

### Background Jobs (`src/jobs/`)
- **Queue**: BullMQ with Upstash Redis — `createQueue`, `addJob`, `createWorker`
- **Processors**: `emailDelivery`, `webhookRetry`, `reportGeneration`, `metricsReport`, `metricsAlert`, `tokenRotation`
- **Rate Limiter**: `createRateLimiter`, `checkRateLimit` — sliding window with in-memory fallback

## Dependencies
- `@musekit/shared` — shared types and utilities
- `@musekit/database` — Supabase client and schema types
- `bullmq` — job queue
- `@upstash/redis` — rate limiting
- `openai` — AI provider SDK (used for all providers via base URL)
- `lucide-react` — icons for components

## Supabase Tables Used
- `notifications` (read/write)
- `webhook_configs` (read/write)
- `feature_toggles` (read/write)
- `api_keys` (read)
- `audit_logs` (write)

## Environment Variables
- `XAI_API_KEY` — xAI Grok API key
- `UPSTASH_REDIS_REST_URL` — Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis token
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
