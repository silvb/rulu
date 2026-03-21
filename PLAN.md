# Rulu

A playful, ADHD-friendly PWA for families to manage recurring weekly todos and time-sensitive events. Designed for two parents sharing one household schedule across iOS and Android devices.

**Name origin:** Rulu — short, fun to say, easy to remember. Think of it as your family's weekly _rules_ and _routines_, squished into something cute.

## What It Does

- **Weekly todo list** — recurring tasks (bathing kids, laundry, groceries…) that can be checked off and automatically reset every Monday
- **Timed events** — repeating reminders like Ju-Jutsu at 16:00 on Tuesdays, with push notifications 15 minutes before
- **Weekly table layout** — 7 day columns (Mon–Sun), responsive: full grid on desktop, tabbed day view on mobile
- **Drag and drop** — move items between days
- **Long-press context menu** — edit or delete any item
- **Quick add** — "+" button per day column opens a modal to create todos or events
- **Progress bar** — shows weekly completion at a glance

## Tech Stack

| Layer          | Choice                                     | Why                                                                 |
| -------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| Framework      | **React 19 + Vite**                        | Fast builds, you know the stack, excellent PWA plugin ecosystem     |
| Styling        | **Tailwind CSS**                           | Utility-first, easy to maintain the playful pink/yellow/green theme |
| PWA            | **vite-plugin-pwa** (Workbox)              | Service worker generation, manifest, offline support                |
| Backend / Sync | **Supabase** (free tier)                   | Postgres DB, Realtime subscriptions, auth, push via Edge Functions  |
| Notifications  | **Web Push API** + Supabase Edge Functions | VAPID-based push, scheduled via pg_cron or Edge Function cron       |
| Deployment     | **Vercel**                                 | Zero-config for Vite, custom domain, HTTPS (required for PWA)       |
| Drag & Drop    | **@dnd-kit/core**                          | Accessible, touch-friendly, works well with React                   |

## Data Model (Supabase / Postgres)

### `items` table

```sql
create table items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  type text not null check (type in ('todo', 'event')),
  title text not null,
  emoji text default '📋',
  day smallint not null check (day between 0 and 6), -- 0 = Monday
  time time, -- only for events, e.g. '16:00'
  sort_order smallint default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### `completions` table

```sql
create table completions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  week_start date not null, -- ISO Monday date, e.g. '2026-03-16'
  completed_by uuid references auth.users(id),
  completed_at timestamptz default now(),
  unique (item_id, week_start)
);
```

Completions are scoped to a `week_start` date. The app calculates the current week's Monday on load and only queries/displays completions for that week. Previous weeks' data is kept for history but ignored in the UI. No cron job needed for the weekly reset — it's implicit.

### `households` table

```sql
create table households (
  id uuid primary key default gen_random_uuid(),
  name text default 'Our Family',
  created_at timestamptz default now()
);
```

### `push_subscriptions` table

```sql
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  household_id uuid not null references households(id),
  subscription jsonb not null, -- PushSubscription object from browser
  created_at timestamptz default now()
);
```

### Row-Level Security

All tables use RLS policies scoped to `household_id`. A user can only read/write data for households they belong to. A simple `household_members` join table links users to households.

## Realtime Sync

Supabase Realtime subscriptions keep both devices in sync:

```ts
const channel = supabase
  .channel("household-changes")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "items",
      filter: `household_id=eq.${householdId}`,
    },
    (payload) => {
      // Update local state based on INSERT / UPDATE / DELETE
    },
  )
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "completions",
    },
    (payload) => {
      // Update completion state
    },
  )
  .subscribe();
```

## Push Notifications Plan

### How It Works

1. **Service worker registration** — `vite-plugin-pwa` generates and registers a service worker. On first load, the app requests notification permission and calls `registration.pushManager.subscribe()` with VAPID keys.
2. **Store subscription** — the `PushSubscription` JSON is saved to the `push_subscriptions` table in Supabase.
3. **Scheduled Edge Function** — a Supabase Edge Function runs on a cron schedule (every 5 minutes). It queries upcoming events within the next 15–20 minutes for the current weekday, cross-references `push_subscriptions` for the relevant household, and sends Web Push notifications via the `web-push` npm library.
4. **Service worker receives push** — the SW displays a native notification with the event title, emoji, and time.

### VAPID Keys

Generate once and store as Supabase secrets:

```bash
npx web-push generate-vapid-keys
```

Store as `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in Supabase Edge Function secrets. The public key is also used client-side when subscribing.

### Edge Function Skeleton

```ts
// supabase/functions/send-reminders/index.ts
import webpush from "web-push";

Deno.serve(async () => {
  const now = new Date();
  const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Mon
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
  const reminderTime = addMinutes(now, 15).toTimeString().slice(0, 5);

  // Query events happening in the next 15 minutes today
  const { data: events } = await supabase
    .from("items")
    .select("*, households!inner(id)")
    .eq("type", "event")
    .eq("day", currentDay)
    .gte("time", currentTime)
    .lte("time", reminderTime);

  for (const event of events ?? []) {
    // Get push subscriptions for this household
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("household_id", event.household_id);

    for (const sub of subs ?? []) {
      await webpush.sendNotification(
        sub.subscription,
        JSON.stringify({
          title: `${event.emoji} ${event.title}`,
          body: `Starting at ${event.time} — in 15 minutes!`,
        }),
      );
    }
  }

  return new Response("OK");
});
```

### iOS Caveats

- Web Push on iOS requires the PWA to be **added to the Home Screen** (not just visited in Safari)
- Supported from **iOS 16.4+** (March 2023)
- The user must explicitly grant notification permission through a user-initiated gesture (button tap)
- Notifications work while the app is backgrounded, but not if the user force-quits it

## Auth Strategy

Keep it minimal for a family app:

- **Supabase Auth with magic links** — each family member signs in with their email, no passwords to remember
- On first sign-in, create a household and a `household_members` entry
- Second family member gets an invite link that joins them to the existing household

## Project Structure

```
rulu/
├── public/
│   ├── manifest.json
│   └── icons/              # PWA icons (192x192, 512x512)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── WeekGrid.tsx
│   │   ├── DayColumn.tsx
│   │   ├── ItemCard.tsx
│   │   ├── AddItemModal.tsx
│   │   ├── EditItemModal.tsx
│   │   ├── ContextMenu.tsx
│   │   ├── ProgressBar.tsx
│   │   └── DayTabs.tsx       # Mobile day selector
│   ├── hooks/
│   │   ├── useItems.ts       # CRUD + Supabase sync
│   │   ├── useCompletions.ts # Check-off logic + weekly reset
│   │   ├── useRealtime.ts    # Supabase Realtime subscription
│   │   ├── useLongPress.ts   # Long-press gesture hook
│   │   └── usePush.ts        # Push subscription management
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client init
│   │   ├── types.ts          # TypeScript types
│   │   └── week.ts           # Week start calculation utilities
│   └── styles/
│       └── globals.css        # Tailwind + custom theme tokens
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       └── send-reminders/
│           └── index.ts
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── PLAN.md                    # This file
```

## Implementation Phases

### Phase 1 — Scaffold & Core UI

- `npm create vite@latest` with React + TypeScript
- Install Tailwind, dnd-kit, vite-plugin-pwa
- Port the prototype component into the component structure above
- Replace inline styles with Tailwind classes
- Set up the playful theme (pink/yellow/green tokens in Tailwind config)

### Phase 2 — Supabase Backend

- Create Supabase project, run the migration SQL
- Set up RLS policies
- Initialize the Supabase JS client
- Build `useItems` and `useCompletions` hooks that read/write to Supabase
- Add Realtime subscriptions for cross-device sync

### Phase 3 — Auth & Households

- Add magic link auth flow (simple email input screen)
- Household creation on first sign-in
- Invite flow: shareable link that joins a second user to the household

### Phase 4 — PWA & Push Notifications

- Configure `vite-plugin-pwa` with manifest, icons, offline caching strategy
- Implement push subscription flow with VAPID keys
- Build the `send-reminders` Edge Function
- Set up pg_cron or Supabase Cron to trigger it every 5 minutes
- Test on iOS (Add to Home Screen) and Android

### Phase 5 — Polish

- Animations with Framer Motion (check-off celebration, drag feedback)
- Haptic feedback via `navigator.vibrate()`
- Optimistic UI updates (instant local state, sync in background)
- Offline support: queue writes when offline, sync when back online
- Accessibility pass: focus management, ARIA labels, reduced motion support
