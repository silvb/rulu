import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TIMEZONE = Deno.env.get("HOUSEHOLD_TIMEZONE") || "Europe/Berlin";

/** Get the current week start date (Monday) in ISO format for the timezone. */
function getCurrentWeekStart(): string {
  const now = new Date();
  const utc = new Date(now.toLocaleString("en-US", { timeZone: TIMEZONE }));
  const day = utc.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(utc);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== cronSecret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const currentWeekStart = getCurrentWeekStart();
  const results: Record<string, unknown> = { currentWeekStart };

  try {
    // 1. Delete completed one-time items from past weeks.
    //    Uncompleted ones are kept — the frontend rolls them forward.
    //    Use a two-step approach to avoid !inner join issues.
    const { data: oneTimeItems } = await supabase
      .from("items")
      .select("id, title, scheduled_for_week")
      .eq("is_one_time", true)
      .lt("scheduled_for_week", currentWeekStart);

    const candidateIds = (oneTimeItems || []).map((i) => i.id);
    let deletedItems = 0;

    if (candidateIds.length > 0) {
      // Find which of these have completions
      const { data: completedRows } = await supabase
        .from("completions")
        .select("item_id")
        .in("item_id", candidateIds);

      const completedIds = [...new Set((completedRows || []).map((c) => c.item_id))];

      if (completedIds.length > 0) {
        const { error } = await supabase.from("items").delete().in("id", completedIds);
        if (error) {
          console.error("Error deleting one-time items:", error);
          results.itemsError = error.message;
        } else {
          deletedItems = completedIds.length;
        }
      }
    }
    results.deletedItems = deletedItems;

    // 2. Delete stale completions from past weeks (recurring items accumulate these)
    const { count, error: staleError } = await supabase
      .from("completions")
      .delete({ count: "exact" })
      .lt("week_start", currentWeekStart);

    if (staleError) {
      console.error("Error deleting stale completions:", staleError);
      results.completionsError = staleError.message;
    }
    results.staleCompletions = count ?? 0;

    console.log(`Cleanup: ${deletedItems} one-time items, ${count ?? 0} stale completions`);
    return Response.json(results);
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return Response.json({ ...results, error: error.message }, { status: 500 });
  }
});
