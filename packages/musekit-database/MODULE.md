# @musekit/database

Supabase client code, schema types, and query helpers for the MuseKit SaaS platform.

## What This Package Does

This module provides the TypeScript code layer to interact with the existing MuseKit Supabase database. It does NOT create or modify tables — it provides typed clients, schemas, and query helpers for an existing database.

## Package Exports

### Supabase Clients (`src/client.ts`)
- `createBrowserClient()` — for client-side React components
- `createServerClient(cookieStore)` — for Next.js server components and API routes
- `createAdminClient()` — using service role key for admin operations

### Database Types (`src/schema.ts`)
TypeScript interfaces for all existing Supabase tables:

**Core tables:** profiles, organizations, team_members, team_invitations, subscriptions, audit_logs, notifications, brand_settings, feature_toggles, content_posts, waitlist, feedback, webhook_configs, email_templates, api_keys

**Extension tables (PassivePost):** social_posts, social_accounts, brand_preferences, social_analytics, post_queue

Each table has Row, Insert, and Update types following Supabase conventions.

### Query Helpers (`src/queries.ts`)
Reusable query functions:
- `getUserById(client, id)`, `getUserByEmail(client, email)`
- `getOrganization(client, id)`, `getOrgMembers(client, orgId)`
- `getSubscription(client, userId)`
- `getNotifications(client, userId, unreadOnly?)`
- `getAuditLogs(client, filters)`, `createAuditLog(client, entry)`
- `getBrandSettings(client)`, `updateBrandSettings(client, settings)`
- `getFeatureToggles(client)`, `updateFeatureToggle(client, key, enabled)`

## Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (for admin client)

## Usage

```typescript
import { createBrowserClient, getUserById } from "@musekit/database";

const client = createBrowserClient();
const user = await getUserById(client, "some-user-id");
```

## Build

```bash
npm run build     # compile TypeScript
npm run dev       # watch mode
npm run typecheck # type-check without emitting
```

## Dependencies

- `@supabase/supabase-js` — Supabase JavaScript client
- `@supabase/ssr` — Supabase SSR helpers for Next.js
