/** Returns the ISO date string (YYYY-MM-DD) of Monday for the current week. */
export function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

/** Returns the current day index (0 = Monday, 6 = Sunday). */
export function getTodayIndex(): number {
  const dow = new Date().getDay();
  return dow === 0 ? 6 : dow - 1;
}

/** Returns the ISO date string for next week's Monday. */
export function getNextWeekStart(): string {
  const current = new Date(getWeekStart() + "T00:00:00");
  current.setDate(current.getDate() + 7);
  return current.toISOString().slice(0, 10);
}

/** 
 * Determines the appropriate week for a one-time item based on:
 * - If item day >= today: current week
 * - If item day < today: next week
 */
export function getScheduledWeekForOneTimeItem(itemDay: number): string {
  const today = getTodayIndex();
  return itemDay >= today ? getWeekStart() : getNextWeekStart();
}

/** Returns the ISO week number for a given date. */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Checks whether an item should be visible in a given week.
 * - weekly: always visible
 * - biweekly: phase 0 = odd ISO weeks, phase 1 = even ISO weeks
 * - monthly: phase 0–3 = 1st–4th week of the month (week containing days 1–7, 8–14, 15–21, 22–28)
 */
export function isItemVisibleInWeek(
  frequency: string | undefined,
  weekStart: string,
  phase: number = 0,
): boolean {
  const freq = frequency || "weekly";
  if (freq === "weekly") return true;

  const monday = new Date(weekStart + "T00:00:00");

  if (freq === "biweekly") {
    const isOdd = getISOWeekNumber(monday) % 2 === 1;
    return phase === 1 ? !isOdd : isOdd;
  }

  if (freq === "monthly") {
    const rangeStart = phase * 7 + 1;
    const rangeEnd = rangeStart + 6;
    for (let offset = 0; offset < 7; offset++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + offset);
      const dom = d.getDate();
      if (dom >= rangeStart && dom <= rangeEnd) return true;
    }
    return false;
  }

  return true;
}

/**
 * Checks if a one-time item should be active (clickable) in the current week.
 * One-time items are only active when scheduled_for_week matches current week.
 */
export function isOneTimeItemActive(scheduledForWeek: string | undefined): boolean {
  if (!scheduledForWeek) return true; // Regular items are always active
  return scheduledForWeek === getWeekStart();
}
