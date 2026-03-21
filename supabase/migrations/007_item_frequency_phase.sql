-- Add frequency_phase column to items
-- biweekly: 0 = odd weeks (default), 1 = even weeks
-- monthly: 0 = 1st week, 1 = 2nd, 2 = 3rd, 3 = 4th
alter table items add column frequency_phase integer not null default 0
  check (frequency_phase >= 0 and frequency_phase <= 3);
