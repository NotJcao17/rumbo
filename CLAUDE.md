# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project Overview

Rumbo is a PWA for FIFA World Cup 2026 in Mexico City, connecting tourists with local micro-businesses. Built by Indivisa Tech for the Fundación Coppel hackathon track.

## Commands

- `npm run dev` — start dev server (uses webpack, NOT turbopack)
- `npm run build` — production build
- `npm run lint` — run ESLint
- `npm start` — start production server

## Architecture

**Stack:** Next.js 16 (App Router) + TypeScript, Supabase (PostgreSQL + PostGIS), Tailwind CSS v4, next-intl v4, PWA via @ducanh2912/next-pwa. Hosted on Vercel.

**Routing:** All pages live under `app/[locale]/` with i18n handled by next-intl. Locales: `en` (default), `es`, `de`. The i18n middleware proxy is in `proxy.ts` (NOT `middleware.ts`).

**Supabase clients:**
- `lib/supabase-client.ts` — browser client using anon key. Safe for `'use client'` components.
- `lib/supabase-server.ts` — server client using service_role key. **Never import in `'use client'` components.**

**Config:**
- `next.config.js` — must stay `.js`, not `.ts`. Composes PWA + next-intl plugins.
- Tailwind v4 has no `tailwind.config.ts`. Theme (colors, fonts) is defined in `app/globals.css` via `@theme`.

**API routes:** `app/api/exchange-rate/` and `app/api/translate-menu/` (stubbed with .gitkeep).

**Translations:** `messages/{en,es,de}.json` loaded by `i18n/request.ts`.

## Design Tokens (Tailwind v4)

- Primary: `#0891B2` (Cyan 600) — `text-primary`, `bg-primary`
- Accent: `#EA580C` (Orange 600) — `text-accent`, `bg-accent`
- Text main: `#164E63` (Cyan 900) — `text-text-main`
- Surface: `#CFFAFE`, Accent soft: `#FFF7ED`, Background: `#F5F5F5`

## Critical Rules

1. **PostGIS coordinates:** `POINT(longitude latitude)` — do NOT invert the order.
2. **Price ranges:** `rango_precios` is a string formatted as `'MIN-MAX'` (e.g., `'80-150'`).
3. **Empty arrays in PostgreSQL:** Use explicit cast `ARRAY[]::text[]`.
4. **Dev server:** Always use `npm run dev`. Never add `--turbopack`.
5. **User roles:** `admin`, `dueno` (business owner). Auth redirects based on role.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
GEMINI_API_KEY=
```
