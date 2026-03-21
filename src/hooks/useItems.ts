import { useState, useCallback, useEffect } from "react";
import type { Item } from "../lib/types";
import { STORAGE_KEY, generateId } from "../lib/constants";
import { getWeekStart } from "../lib/week";

const defaultItems: Item[] = [
  { id: generateId(), type: "todo", title: "Bath kids", day: 2, emoji: "🛁" },
  { id: generateId(), type: "todo", title: "Clip nails", day: 6, emoji: "✂️" },
  { id: generateId(), type: "todo", title: "Laundry", day: 5, emoji: "👕" },
  { id: generateId(), type: "todo", title: "Grocery shopping", day: 5, emoji: "🛒" },
  { id: generateId(), type: "todo", title: "Vacuum living room", day: 3, emoji: "🧹" },
  { id: generateId(), type: "event", title: "Ju-Jutsu", day: 1, time: "16:00", emoji: "🥋" },
  { id: generateId(), type: "event", title: "Choir", day: 3, time: "15:30", emoji: "🎵" },
];

function loadFromStorage(): { items: Item[]; completions: Record<string, boolean> } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const items = data.items || defaultItems;
      const completions = data.weekStart !== getWeekStart() ? {} : data.completions || {};
      return { items, completions };
    }
  } catch {
    // fall through
  }
  return { items: defaultItems, completions: {} };
}

export function useItems() {
  const [{ items, completions }, setState] = useState(loadFromStorage);
  const loaded = true;

  // Persist to localStorage
  useEffect(() => {
    if (!loaded) return;
    const data = { items, completions, weekStart: getWeekStart() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [items, completions, loaded]);

  const setItems = useCallback(
    (updater: (prev: Item[]) => Item[]) => setState((s) => ({ ...s, items: updater(s.items) })),
    [],
  );

  const setCompletions = useCallback(
    (updater: (prev: Record<string, boolean>) => Record<string, boolean>) =>
      setState((s) => ({ ...s, completions: updater(s.completions) })),
    [],
  );

  const addItem = useCallback(
    (item: Omit<Item, "id">) => {
      setItems((prev) => [...prev, { ...item, id: generateId() }]);
    },
    [setItems],
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<Item>) => {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)));
    },
    [setItems],
  );

  const deleteItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((it) => it.id !== id));
      setCompletions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [setItems, setCompletions],
  );

  const moveItem = useCallback(
    (id: string, toDay: number) => {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, day: toDay } : it)));
    },
    [setItems],
  );

  const toggleCompletion = useCallback(
    (id: string) => {
      setCompletions((prev) => {
        const next = { ...prev };
        if (next[id]) {
          delete next[id];
        } else {
          next[id] = true;
        }
        return next;
      });
    },
    [setCompletions],
  );

  return {
    items,
    completions,
    loaded,
    addItem,
    updateItem,
    deleteItem,
    moveItem,
    toggleCompletion,
  };
}
