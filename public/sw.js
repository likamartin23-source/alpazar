const CACHE_NAME = 'alpazar-v10'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  if (req.method !== 'GET') return

  // Navigime dhe API → gjithmonë network-first (kurrë mos shërbe HTML të vjetër)
  if (req.mode === 'navigate' || url.pathname.startsWith('/api') ||
      url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(req).catch(() => caches.match('/offline.html'))
    )
    return
  }

  // Vetëm asetet statike (js/css/img/font) → cache-first
  if (/\.(js|css|png|jpg|jpeg|webp|svg|woff2?|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        const copy = res.clone()
        caches.open(CACHE_NAME).then(ca => ca.put(req, copy))
        return res
      }))
    )
    return
  }

  // Tjetra → rrjeti
  event.respondWith(fetch(req).catch(() => caches.match(req)))
})

self.addEventListener('push', (event) => {
  let data = { title: 'ALPAZAR', body: 'Ke një mesazh të ri!' }
  try { if (event.data) data = event.data.json() } catch { /* malformed push payload — use defaults */ }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      vibrate: [200, 100, 200],
      tag: 'alpazar-notification',
      renotify: true,
      // Ruaj destinacionin që notificationclick ta hapë objektin e saktë
      // (shpallje/mesazh/profil), jo gjithmonë /messages.
      data: { url: data.url || data.link || '/notifications' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/messages'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const existing = wins.find(w => w.url.includes(self.location.origin))
      if (existing) { existing.focus(); existing.navigate(targetUrl) }
      else clients.openWindow(targetUrl)
    })
  )
})
