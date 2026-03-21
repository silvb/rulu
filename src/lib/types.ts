export type ItemType = "todo" | "event";

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  day: number; // 0 = Monday, 6 = Sunday
  emoji: string;
  time?: string; // HH:MM, only for events
  sort_order?: number;
}

export interface ContextMenuState {
  item: Item;
  x: number;
  y: number;
}
