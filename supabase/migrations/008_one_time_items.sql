-- Add one-time item support
-- is_one_time: boolean flag to mark items as one-time
-- scheduled_for_week: ISO date string for the week when item should be active
alter table items add column is_one_time boolean not null default false;
alter table items add column scheduled_for_week text;

-- Index for cleanup queries
create index items_one_time_completed_idx on items (is_one_time, scheduled_for_week) where is_one_time = true;