import { useState, useCallback, useEffect } from "react";
import type { Item } from "../lib/types";
import { supabase } from "../lib/supabase";
import { getWeekStart } from "../lib/week";

function isVisibleTo(item: Item, memberId: string): boolean {
  return !item.owner_id || item.owner_id === memberId;
}

export function useItems(memberId: string, householdId: string) {
  const [items, setItems] = useState<Item[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  const weekStart = getWeekStart();

  // Initial fetch
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [itemsRes, completionsRes] = await Promise.all([
        supabase
          .from("items")
          .select("*")
          .eq("household_id", householdId)
          .or(`owner_id.is.null,owner_id.eq.${memberId}`),
        supabase.from("completions").select("*").eq("week_start", weekStart),
      ]);

      if (cancelled) return;

      if (itemsRes.data) {
        const completedItemIds = new Set(
          (completionsRes.data || []).map((c: { item_id: string }) => c.item_id),
        );

        // Roll forward uncompleted one-time items from past weeks
        const rollForwardIds: string[] = [];
        for (const item of itemsRes.data as Item[]) {
          if (
            item.is_one_time &&
            item.scheduled_for_week &&
            item.scheduled_for_week < weekStart &&
            !completedItemIds.has(item.id)
          ) {
            item.scheduled_for_week = weekStart;
            rollForwardIds.push(item.id);
          }
        }
        if (rollForwardIds.length > 0) {
          supabase
            .from("items")
            .update({ scheduled_for_week: weekStart })
            .in("id", rollForwardIds)
            .then();
        }

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
  }, [weekStart, memberId]);

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
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newItem = payload.new as Item;
            if (!isVisibleTo(newItem, memberId)) return;
            setItems((prev) => {
              if (prev.some((i) => i.id === newItem.id)) return prev;
              return [...prev, newItem];
            });
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Item;
            if (!isVisibleTo(updated, memberId)) {
              // Item became personal for someone else — remove it
              setItems((prev) => prev.filter((i) => i.id !== updated.id));
            } else {
              setItems((prev) =>
                prev.some((i) => i.id === updated.id)
                  ? prev.map((i) => (i.id === updated.id ? updated : i))
                  : [...prev, updated],
              );
            }
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
  }, [weekStart, memberId]);

  const addItem = useCallback(
    async (item: Omit<Item, "id" | "household_id">) => {
      // Optimistic: add with a temporary ID immediately
      const tempId = `temp-${Date.now()}`;
      const optimistic: Item = {
        ...item,
        id: tempId,
        household_id: householdId,
        owner_id: item.owner_id ?? null,
      };
      setItems((prev) => [...prev, optimistic]);

      const row = {
        ...item,
        household_id: householdId,
        owner_id: item.owner_id ?? null,
      };
      const { data } = await supabase.from("items").insert(row).select().single();
      if (data) {
        // Swap temp ID for real ID (realtime may have already added it)
        setItems((prev) => {
          const withoutTemp = prev.filter((i) => i.id !== tempId);
          if (withoutTemp.some((i) => i.id === data.id)) return withoutTemp;
          return [...withoutTemp, data as Item];
        });
      }
    },
    [householdId],
  );

  const updateItem = useCallback(async (id: string, updates: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)));
    await supabase.from("items").update(updates).eq("id", id);
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setCompletions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    await supabase.from("items").delete().eq("id", id);
  }, []);

  const moveItem = useCallback(async (id: string, toDay: number) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, day: toDay } : it)));
    await supabase.from("items").update({ day: toDay }).eq("id", id);
  }, []);

  const toggleCompletion = useCallback(
    async (id: string) => {
      const wasDone = completions[id];
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
        await supabase.from("completions").delete().eq("item_id", id).eq("week_start", weekStart);
      } else {
        await supabase.from("completions").insert({ item_id: id, week_start: weekStart });
      }
    },
    [completions, weekStart],
  );

  return {
    items,
    completions,
    weekStart,
    loaded,
    addItem,
    updateItem,
    deleteItem,
    moveItem,
    toggleCompletion,
  };
}
