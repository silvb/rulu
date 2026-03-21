export type ItemType = "todo" | "event";
export type Frequency = "weekly" | "biweekly" | "monthly";

export interface Item {
  id: string;
  household_id?: string;
  owner_id?: string | null; // null = shared, set = personal item
  type: ItemType;
  title: string;
  day: number; // 0 = Monday, 6 = Sunday
  emoji: string;
  time?: string; // HH:MM, only for events
  frequency?: Frequency; // default: weekly
  sort_order?: number;
}

export interface Completion {
  id: string;
  item_id: string;
  week_start: string; // ISO date, e.g. '2026-03-16'
  completed_at: string;
}

export interface Member {
  id: string;
  household_id: string;
  name: string;
  emoji: string;
}

export interface ContextMenuState {
  item: Item;
  x: number;
  y: number;
}
