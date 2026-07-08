self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  let data;
  try {
    data = event.data?.json();
  } catch {
    data = { title: "Gridhub", message: event.data?.text() ?? "New notification" };
  }

  const title = data?.title || "Gridhub";
  const body = data?.message || data?.body || "You have a new notification";
  const tag = data?.tag || "gridhub-notification";
  const icon = data?.icon || "/favicon.svg";
  const url = data?.url || "/notifications";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      tag,
      data: { url },
      vibrate: [100, 50, 100],
      requireInteraction: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/notifications";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});