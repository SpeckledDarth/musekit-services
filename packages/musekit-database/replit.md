# @musekit/database

## Overview
TypeScript library package providing Supabase client code, schema types, and query helpers for the MuseKit SaaS platform. This module is a code layer for an existing Supabase database — it does NOT create or modify database tables.

## Project Structure
```
src/
  index.ts          — barrel export (all public API)
  client.ts         — Supabase client factories (browser, server, admin)
  schema.ts         — TypeScript interfaces for all database tables + Database type
  queries.ts        — reusable query helper functions
  migrations/
    core/           — SQL documentation of core table schemas
    extensions/     — SQL documentation of extension table schemas (PassivePost)
dist/               — compiled JavaScript output (auto-generated)
```

## Tech Stack
- TypeScript (ES2022, ESNext modules)
- @supabase/supabase-js — Supabase JavaScript client
- @supabase/ssr — Supabase SSR helpers for Next.js integration
- Node.js 20

## Build & Development
- `npm run build` — compile TypeScript to dist/
- `npm run dev` — watch mode (continuous compilation)
- `npm run typecheck` — type-check only, no output
- Workflow "Start application" runs `npx tsc -w` for dev mode

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (admin operations)

## Database Tables
Core: profiles, organizations, team_members, team_invitations, subscriptions, audit_logs, notifications, brand_settings, feature_toggles, content_posts, waitlist, feedback, webhook_configs, email_templates, api_keys

Extensions (PassivePost): social_posts, social_accounts, brand_preferences, social_analytics, post_queue

## Reference
- Original implementation: github.com/SpeckledDarth/master-saas-muse
- Shared types package: github.com/SpeckledDarth/musekit-shared
