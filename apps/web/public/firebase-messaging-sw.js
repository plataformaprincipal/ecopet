/* EcoPet — Firebase Cloud Messaging service worker
 *
 * Config pública carregada em runtime via /api/firebase/messaging-config
 * (apenas NEXT_PUBLIC_*). Sem Service Account. Sem segredos.
 */
/* eslint-disable no-undef */

importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js");

const DEFAULT_ICON = "/brand/ecopet-logo.png";
const DEFAULT_BADGE = "/brand/ecopet-logo.png";

function sanitizeUrl(raw) {
  if (!raw || typeof raw !== "string") return "/notifications";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/notifications";
  if (/^(https?:|javascript:|data:)/i.test(trimmed)) return "/notifications";
  if (trimmed.includes("\\") || trimmed.includes("@")) return "/notifications";
  const path = trimmed.split("?")[0].split("#")[0];
  const allowed =
    path === "/" ||
    path === "/notifications" ||
    path === "/notificacoes" ||
    path === "/mensagens" ||
    path === "/messages" ||
    path === "/agenda" ||
    path.startsWith("/client/") ||
    path.startsWith("/partner/") ||
    path.startsWith("/ngo/") ||
    path.startsWith("/ong/") ||
    path.startsWith("/admin/") ||
    path.startsWith("/pedidos/") ||
    path.startsWith("/orders/") ||
    path.startsWith("/social/") ||
    path.startsWith("/marketplace/") ||
    path.startsWith("/settings") ||
    path.startsWith("/configuracoes") ||
    path.startsWith("/suporte") ||
    path.startsWith("/support");
  return allowed ? trimmed.split("#")[0].slice(0, 400) : "/notifications";
}

function showEcoPetNotification(title, options) {
  const tag = options.tag || "ecopet";
  return self.registration.showNotification(title || "EcoPet", {
    body: options.body || "",
    icon: options.icon || DEFAULT_ICON,
    badge: options.badge || DEFAULT_BADGE,
    tag,
    data: { url: sanitizeUrl(options.url), notificationId: options.notificationId || null },
    renotify: Boolean(options.renotify),
  });
}

let messagingReady = null;

function initFirebaseMessaging() {
  if (messagingReady) return messagingReady;

  messagingReady = fetch("/api/firebase/messaging-config", { credentials: "same-origin" })
    .then(function (res) {
      if (!res.ok) throw new Error("config_unavailable");
      return res.json();
    })
    .then(function (json) {
      var config = (json && json.data && json.data.config) || (json && json.config);
      if (!config || !config.apiKey || !config.projectId || !config.appId) {
        throw new Error("config_incomplete");
      }
      if (!firebase.apps.length) {
        firebase.initializeApp(config);
      }
      var messaging = firebase.messaging();
      messaging.onBackgroundMessage(function (payload) {
        var n = payload.notification || {};
        var d = payload.data || {};
        var title = n.title || d.title || "EcoPet";
        var body = n.body || d.body || "";
        var url = d.url || (n.click_action || "/notifications");
        var tag = d.tag || d.notificationId || "ecopet-fcm";
        return showEcoPetNotification(title, {
          body: body,
          icon: d.icon || n.icon || DEFAULT_ICON,
          badge: d.badge || DEFAULT_BADGE,
          tag: tag,
          url: url,
          notificationId: d.notificationId,
        });
      });
      return messaging;
    })
    .catch(function () {
      messagingReady = null;
      return null;
    });

  return messagingReady;
}

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(initFirebaseMessaging());
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    Promise.all([self.clients.claim(), initFirebaseMessaging()])
  );
});

/** Clique — apenas rotas internas sanitizadas. */
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = sanitizeUrl(
    (event.notification.data && event.notification.data.url) || "/notifications"
  );
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i += 1) {
        var client = clientList[i];
        if ("focus" in client) {
          if ("navigate" in client) {
            return client.navigate(url).then(function (c) {
              return c && c.focus ? c.focus() : client.focus();
            });
          }
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
