-- Phase 4: Push notifications table
-- Paste this into your Supabase SQL Editor and click "Run"

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz default now()
);

-- Prevent duplicate subscriptions per device
create unique index if not exists push_subscriptions_user_endpoint_idx
  on push_subscriptions (user_id, ((subscription->>'endpoint')));

-- RLS
alter table push_subscriptions enable row level security;

create policy "Users manage own push subscriptions"
  on push_subscriptions for all
  using (user_id = auth.uid());
