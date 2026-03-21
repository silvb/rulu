# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rulu is a family weekly planner PWA — an ADHD-friendly app for two parents to manage recurring todos and timed events across iOS/Android. Weekly tasks auto-reset each Monday; timed events trigger push notifications.

## Tech Stack

- **Frontend:** React 19, Vite+ (Vite 8 + oxlint + oxfmt unified), TypeScript, Tailwind CSS v4, @dnd-kit (drag & drop)
- **Backend (planned):** Supabase (Postgres, Realtime, Auth with magic links, Edge Functions)
- **PWA:** vite-plugin-pwa (Workbox), Web Push API with VAPID keys
- **Deployment:** Vercel
- **Toolchain:** Vite+ (`vp` CLI) — unified dev/build/lint/format/test
- **Package manager:** pnpm

## Commands

```bash
vp install           # install dependencies
vp dev               # start dev server
vp build             # production build
vp check             # format + lint + typecheck (use --fix to auto-fix)
vp lint              # lint only (oxlint)
vp fmt               # format only (oxfmt)
vp test              # run tests (vitest)
vp preview           # preview production build locally
```

## Architecture

- `src/components/` — WeekGrid (orchestrator), DayColumn, ItemCard, ItemModal (add/edit), ContextMenu, ProgressBar, DayTabs (mobile)
- `src/hooks/` — useItems (CRUD + localStorage persistence + completions), useLongPress (touch gesture)
- `src/lib/` — types, constants (days, emojis, id generation), week utilities (getWeekStart, getTodayIndex)
- `supabase/migrations/` — Postgres schema with RLS (items, completions, households, push_subscriptions)
- `supabase/functions/send-reminders/` — Edge Function stub for push notification cron

## Key Design Decisions

- **Week start is Monday (day 0).** Days are 0–6 (Mon–Sun). `getWeekStart()` in `src/lib/week.ts` returns the ISO Monday date string.
- **Weekly reset is implicit** — completions are scoped to a `week_start` date, no cron needed. The app queries only the current week's completions.
- **Currently localStorage-only.** Supabase integration is Phase 2 (see PLAN.md). The `useItems` hook will be swapped to use Supabase when ready.
- **Responsive layout:** Full 7-column grid on desktop (`<768px` breakpoint), tabbed single-day view on mobile.
- **Tailwind v4** with CSS-based config in `src/index.css` using `@theme` for the pink/yellow/green color tokens.
- **RLS on all tables** scoped by `household_id`. Users can only access their household's data.
- **Auth via magic links** — no passwords. Household created on first sign-in; second parent joins via invite link.
