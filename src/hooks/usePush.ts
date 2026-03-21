import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { urlBase64ToUint8Array } from "../lib/push";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function usePush(householdId: string | null) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const supported = isPushSupported();

  // Check current permission and existing subscription on mount
  useEffect(() => {
    if (!supported) return;

    setPermission(Notification.permission);

    async function check() {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        setSubscribed(!!existing);
      } catch {
        // SW not ready yet, that's ok
      }
    }

    check();
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported || !householdId || !VAPID_PUBLIC_KEY) return;

    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          household_id: householdId,
          subscription: subscription.toJSON(),
        },
        { onConflict: "user_id,subscription->>'endpoint'" },
      );

      if (error) {
        // Fallback: delete existing and insert fresh
        await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
        await supabase.from("push_subscriptions").insert({
          user_id: user.id,
          household_id: householdId,
          subscription: subscription.toJSON(),
        });
      }

      setSubscribed(true);
    } catch {
      // Subscription failed — permission denied or SW issue
    }
    setLoading(false);
  }, [supported, householdId]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;

    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
      }

      setSubscribed(false);
    } catch {
      // Unsubscribe failed
    }
    setLoading(false);
  }, [supported]);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}
