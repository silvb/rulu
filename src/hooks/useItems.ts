import { useState, useCallback, useEffect } from "react";
import type { Item } from "../lib/types";
import { supabase, HOUSEHOLD_ID } from "../lib/supabase";
import { getWeekStart } from "../lib/week";

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  const weekStart = getWeekStart();

  // Initial fetch
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [itemsRes, completionsRes] = await Promise.all([
        supabase.from("items").select("*").eq("household_id", HOUSEHOLD_ID),
        supabase.from("completions").select("*").eq("week_start", weekStart),
      ]);

      if (cancelled) return;

      if (itemsRes.data) {
        setItems(itemsRes.data as Item[]);
      }

      if (completionsRes.data) {
        const map: Record<string, boolean> = {};
        for (const c of completionsRes.data) {
          map[c.item_id as string] = true;
        }
        setCompletions(map);
      }

      setLoaded(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("household-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
          filter: `household_id=eq.${HOUSEHOLD_ID}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) => {
              if (prev.some((i) => i.id === (payload.new as Item).id)) return prev;
              return [...prev, payload.new as Item];
            });
          } else if (payload.eventType === "UPDATE") {
            setItems((prev) =>
              prev.map((i) => (i.id === (payload.new as Item).id ? (payload.new as Item) : i)),
            );
          } else if (payload.eventType === "DELETE") {
            setItems((prev) => prev.filter((i) => i.id !== (payload.old as Item).id));
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "completions",
        },
        (payload) => {
          const record = (payload.eventType === "DELETE" ? payload.old : payload.new) as {
            item_id: string;
            week_start: string;
          };
          if (record.week_start !== weekStart) return;

          if (payload.eventType === "INSERT") {
            setCompletions((prev) => ({ ...prev, [record.item_id]: true }));
          } else if (payload.eventType === "DELETE") {
            setCompletions((prev) => {
              const next = { ...prev };
              delete next[record.item_id];
              return next;
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [weekStart]);

  const addItem = useCallback(
    async (item: Omit<Item, "id">) => {
      const row = { ...item, household_id: HOUSEHOLD_ID };
      const { data } = await supabase.from("items").insert(row).select().single();
      if (data) {
        setItems((prev) => {
          if (prev.some((i) => i.id === data.id)) return prev;
          return [...prev, data as Item];
        });
      }
    },
    [],
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<Item>) => {
      // Optimistic update
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)));
      await supabase.from("items").update(updates).eq("id", id);
    },
    [],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      // Optimistic update
      setItems((prev) => prev.filter((it) => it.id !== id));
      setCompletions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await supabase.from("items").delete().eq("id", id);
    },
    [],
  );

  const moveItem = useCallback(
    async (id: string, toDay: number) => {
      // Optimistic update
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, day: toDay } : it)));
      await supabase.from("items").update({ day: toDay }).eq("id", id);
    },
    [],
  );

  const toggleCompletion = useCallback(
    async (id: string) => {
      const wasDone = completions[id];
      // Optimistic update
      setCompletions((prev) => {
        const next = { ...prev };
        if (next[id]) {
          delete next[id];
        } else {
          next[id] = true;
        }
        return next;
      });

      if (wasDone) {
        await supabase
          .from("completions")
          .delete()
          .eq("item_id", id)
          .eq("week_start", weekStart);
      } else {
        await supabase.from("completions").insert({ item_id: id, week_start: weekStart });
      }
    },
    [completions, weekStart],
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
