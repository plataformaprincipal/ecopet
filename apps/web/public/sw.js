/* EcoPet — minimal Web Push service worker */
self.addEventListener("push", (event) => {
  let data = { title: "EcoPet", body: "", url: "/" };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = {
        title: parsed.title || "EcoPet",
        body: parsed.body || parsed.message || "",
        url: parsed.url || parsed.data?.url || "/",
      };
    }
  } catch {
    try {
      const text = event.data && event.data.text();
      if (text) data.body = text;
    } catch {
      /* ignore */
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url },
      icon: "/brand/ecopet-logo.png",
      badge: "/brand/ecopet-logo.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
