// deno-lint-ignore-file no-explicit-any
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET");
const TIMEZONE = Deno.env.get("HOUSEHOLD_TIMEZONE") || "Europe/Berlin";

webpush.setVapidDetails("mailto:noreply@rulu.app", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

/** Get current time in the household timezone as HH:MM and day index (0=Mon). */
function getNow(): { hhmm: string; dayIndex: number } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const hhmm = formatter.format(now);

  const dayFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    weekday: "short",
  });
  const dayName = dayFormatter.format(now);
  const dayMap: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return { hhmm, dayIndex: dayMap[dayName] ?? 0 };
}

/** Add minutes to an HH:MM string. */
function addMinutesHHMM(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

Deno.serve(async (req) => {
  // Verify cron secret if configured
  if (CRON_SECRET) {
    const auth = req.headers.get("Authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { hhmm, dayIndex } = getNow();
  const in15 = addMinutesHHMM(hhmm, 15);

  // Query events in the 15-minute reminder window for today
  const { data: events, error } = await supabase
    .from("items")
    .select("id, household_id, title, emoji, time")
    .eq("type", "event")
    .eq("day", dayIndex)
    .gt("time", hhmm)
    .lte("time", in15);

  if (error || !events?.length) {
    return Response.json({ sent: 0, events: 0, error: error?.message });
  }

  // Group events by household
  const byHousehold = new Map<string, typeof events>();
  for (const event of events) {
    const list = byHousehold.get(event.household_id) ?? [];
    list.push(event);
    byHousehold.set(event.household_id, list);
  }

  let sent = 0;
  let failed = 0;

  for (const [householdId, householdEvents] of byHousehold) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("household_id", householdId);

    if (!subs?.length) continue;

    for (const event of householdEvents) {
      const payload = JSON.stringify({
        title: `${event.emoji} ${event.title}`,
        body: `Starting at ${event.time} — in 15 minutes!`,
        tag: `event-${event.id}`,
      });

      for (const sub of subs) {
        try {
          await webpush.sendNotification(sub.subscription as any, payload);
          sent++;
        } catch (err: any) {
          failed++;
          // Clean up expired/invalid subscriptions
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }
    }
  }

  return Response.json({ sent, failed, events: events.length });
});
