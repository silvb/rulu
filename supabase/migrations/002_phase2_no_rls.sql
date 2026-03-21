-- Phase 2 migration: tables only, no RLS (auth comes in Phase 3)
-- Paste this into your Supabase SQL Editor and click "Run"

-- Households
create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text default 'Our Family',
  created_at timestamptz default now()
);

-- Items (todos and events)
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  type text not null check (type in ('todo', 'event')),
  title text not null,
  emoji text default '📋',
  day smallint not null check (day between 0 and 6),
  time time,
  sort_order smallint default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Completions (scoped to week_start for implicit weekly reset)
create table if not exists completions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  week_start date not null,
  completed_at timestamptz default now(),
  unique (item_id, week_start)
);

-- Insert a default household (save this ID!)
insert into households (name) values ('Our Family');

-- Enable Realtime for items and completions
alter publication supabase_realtime add table items;
alter publication supabase_realtime add table completions;
