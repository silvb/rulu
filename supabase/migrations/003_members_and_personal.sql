-- Phase 3: members table + personal items
-- Paste this into your Supabase SQL Editor and click "Run"

-- Members (manually populated — no auth needed)
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  emoji text default '👤'
);

-- Add owner_id to items (NULL = shared, set = personal)
alter table items add column if not exists owner_id uuid references members(id);

-- Enable Realtime for members
alter publication supabase_realtime add table members;

-- After running this, insert your household members manually:
-- insert into members (household_id, name, emoji) values
--   ('<your-household-uuid>', 'Silvio', '👨'),
--   ('<your-household-uuid>', 'Partner', '👩');
