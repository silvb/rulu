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
 * - biweekly: visible on odd ISO weeks
 * - monthly: visible only in the week containing the 1st–7th (first occurrence of item.day)
 */
export function isItemVisibleInWeek(frequency: string | undefined, weekStart: string): boolean {
  const freq = frequency || "weekly";
  if (freq === "weekly") return true;

  const monday = new Date(weekStart + "T00:00:00");

  if (freq === "biweekly") {
    return getISOWeekNumber(monday) % 2 === 1;
  }

  if (freq === "monthly") {
    // The item shows in the first week of the month that contains day 1–7
    // Check if any day in this Mon–Sun week falls on the 1st–7th
    for (let offset = 0; offset < 7; offset++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + offset);
      if (d.getDate() <= 7) return true;
    }
    return false;
  }

  return true;
}
