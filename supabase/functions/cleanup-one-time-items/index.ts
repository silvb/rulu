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
  // Verify cron secret (passed via x-cron-secret to avoid Supabase gateway conflicts)
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== cronSecret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const currentWeekStart = getCurrentWeekStart();

  try {
    // Find completed one-time items that are scheduled for this week or earlier
    // (one-time items that are completed and should be cleaned up)
    const { data: itemsToDelete, error: fetchError } = await supabase
      .from("items")
      .select(`
        id,
        title,
        is_one_time,
        scheduled_for_week,
        completions!inner (
          item_id,
          week_start
        )
      `)
      .eq("is_one_time", true)
      .lte("scheduled_for_week", currentWeekStart);

    if (fetchError) {
      console.error("Error fetching completed one-time items:", fetchError);
      return Response.json({ 
        error: fetchError.message, 
        deleted: 0 
      }, { status: 500 });
    }

    if (!itemsToDelete || itemsToDelete.length === 0) {
      return Response.json({ 
        message: "No completed one-time items to clean up", 
        deleted: 0 
      });
    }

    // Extract item IDs to delete
    const itemIds = itemsToDelete.map(item => item.id);

    // Delete the completed one-time items
    const { error: deleteError } = await supabase
      .from("items")
      .delete()
      .in("id", itemIds);

    if (deleteError) {
      console.error("Error deleting completed one-time items:", deleteError);
      return Response.json({ 
        error: deleteError.message, 
        deleted: 0 
      }, { status: 500 });
    }

    console.log(`Cleaned up ${itemIds.length} completed one-time items`);

    return Response.json({ 
      message: `Successfully cleaned up ${itemIds.length} completed one-time items`,
      deleted: itemIds.length,
      deletedItems: itemsToDelete.map(item => ({
        id: item.id,
        title: item.title,
        scheduled_for_week: item.scheduled_for_week
      }))
    });

  } catch (error: any) {
    console.error("Unexpected error in cleanup:", error);
    return Response.json({ 
      error: error.message,
      deleted: 0 
    }, { status: 500 });
  }
});