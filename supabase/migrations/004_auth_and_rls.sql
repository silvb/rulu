-- Phase 3b: Real auth with RLS
-- Paste this into your Supabase SQL Editor and click "Run"

-- Link auth users to households
create table if not exists household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (household_id, user_id)
);

-- Enable RLS on all tables
alter table households enable row level security;
alter table household_members enable row level security;
alter table members enable row level security;
alter table items enable row level security;
alter table completions enable row level security;

-- household_members: users can see their own memberships
create policy "Users see own memberships"
  on household_members for select
  using (user_id = auth.uid());

-- households: visible if you're a member
create policy "Members see their household"
  on households for select
  using (id in (
    select household_id from household_members where user_id = auth.uid()
  ));

-- members: visible if in the same household
create policy "Members see household profiles"
  on members for select
  using (household_id in (
    select household_id from household_members where user_id = auth.uid()
  ));

-- items: full CRUD scoped to household membership
create policy "Members see household items"
  on items for select
  using (household_id in (
    select household_id from household_members where user_id = auth.uid()
  ));

create policy "Members insert household items"
  on items for insert
  with check (household_id in (
    select household_id from household_members where user_id = auth.uid()
  ));

create policy "Members update household items"
  on items for update
  using (household_id in (
    select household_id from household_members where user_id = auth.uid()
  ));

create policy "Members delete household items"
  on items for delete
  using (household_id in (
    select household_id from household_members where user_id = auth.uid()
  ));

-- completions: accessible if the item belongs to the user's household
create policy "Members manage completions"
  on completions for all
  using (item_id in (
    select i.id from items i
    where i.household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  ));

-- After running this migration:
-- 1. Create an auth user in Supabase Dashboard > Authentication > Users > "Add user"
--    (use email + password, e.g. silvio@example.com / your-password)
-- 2. Copy the auth user's UUID from the dashboard
-- 3. Link it to your household:
--    INSERT INTO household_members (household_id, user_id)
--    VALUES ('<your-household-uuid>', '<auth-user-uuid>');
