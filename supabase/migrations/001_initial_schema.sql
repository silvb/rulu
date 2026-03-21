-- Households
create table households (
  id uuid primary key default gen_random_uuid(),
  name text default 'Our Family',
  created_at timestamptz default now()
);

-- Household members (join table)
create table household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (household_id, user_id)
);

-- Items (todos and events)
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

-- Completions (scoped to week_start for implicit weekly reset)
create table completions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  week_start date not null, -- ISO Monday date, e.g. '2026-03-16'
  completed_by uuid references auth.users(id),
  completed_at timestamptz default now(),
  unique (item_id, week_start)
);

-- Push subscriptions
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  household_id uuid not null references households(id),
  subscription jsonb not null,
  created_at timestamptz default now()
);

-- RLS policies
alter table households enable row level security;
alter table household_members enable row level security;
alter table items enable row level security;
alter table completions enable row level security;
alter table push_subscriptions enable row level security;

-- Household members can read their own households
create policy "Users can view their households"
  on households for select
  using (id in (select household_id from household_members where user_id = auth.uid()));

-- Household members can view membership
create policy "Users can view household members"
  on household_members for select
  using (user_id = auth.uid());

-- Items: scoped to household membership
create policy "Users can view items in their household"
  on items for select
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "Users can insert items in their household"
  on items for insert
  with check (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "Users can update items in their household"
  on items for update
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "Users can delete items in their household"
  on items for delete
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

-- Completions: accessible if the item belongs to user's household
create policy "Users can manage completions for their items"
  on completions for all
  using (item_id in (
    select i.id from items i
    join household_members hm on hm.household_id = i.household_id
    where hm.user_id = auth.uid()
  ));

-- Push subscriptions: users manage their own
create policy "Users can manage their push subscriptions"
  on push_subscriptions for all
  using (user_id = auth.uid());
