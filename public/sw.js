/* BOC Faw — Service Worker v2.0 — Push + Cache */
const CACHE_NAME = "boc-faw-v2";
const STATIC = ["/", "/index.html"];

/* ── Install ── */
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC).catch(()=>{})));
  self.skipWaiting();
});

/* ── Activate ── */
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── Fetch (Cache first for static, network first for API) ── */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("firebasedatabase.app")) return; // لا تخزن Firebase requests
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

/* ── Push Notifications ── */
self.addEventListener("push", e => {
  let data = { title: "BOC الفاو", body: "إشعار جديد" };
  try {
    if (e.data) data = e.data.json();
  } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title || "BOC الفاو", {
      body: data.body || "",
      icon: "/logo192.png",
      badge: "/logo192.png",
      dir: "rtl",
      lang: "ar",
      vibrate: [200, 100, 200],
      tag: data.tag || "boc-notif",
      renotify: true,
      data: data,
    })
  );
});

/* ── Notification click → open app ── */
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          return;
        }
      }
      return clients.openWindow("/");
    })
  );
});
