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
