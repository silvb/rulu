-- Add frequency column to items (weekly, biweekly, monthly)
alter table items add column frequency text not null default 'weekly'
  check (frequency in ('weekly', 'biweekly', 'monthly'));
