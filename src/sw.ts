/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

// Workbox injects the precache manifest here at build time
precacheAndRoute(self.__WB_MANIFEST);

// Push notification handler
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "Rulu Reminder";
  const options: NotificationOptions = {
    body: data.body || "You have an upcoming event",
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    tag: data.tag || "rulu-reminder",
    data: { url: "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler — open/focus the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow(event.notification.data?.url || "/");
    }),
  );
});
