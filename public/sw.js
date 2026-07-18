const CACHE_NAME = 'alpazar-v12'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  if (req.method !== 'GET') return

  // Navigime + API + Supabase -> network-first (HTML/te dhena gjithmone te freskta)
  if (req.mode === 'navigate' || url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then(c => c || caches.match('/offline.html')))
    )
    return
  }

  // Asetet immutable te Next (content-hashed) -> cache-first (s'ndryshojne kurre ne te njejtin URL)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        const copy = res.clone()
        caches.open(CACHE_NAME).then(ca => ca.put(req, copy))
        return res
      }))
    )
    return
  }

  // Asetet e tjera statike (ikona, favicon, fonte, manifest, imazhe) -> stale-while-revalidate
  // Shpejt nga cache, POR rifreskohet gjithmone ne sfond -> ndryshimet pasqyrohen, kurre s'ngec.
  if (/\.(js|css|png|jpg|jpeg|webp|svg|gif|woff2?|ico|json)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(req).then(cached => {
          const network = fetch(req).then(res => {
            cache.put(req, res.clone())
            return res
          }).catch(() => cached)
          return cached || network
        })
      )
    )
    return
  }

  // Tjetra -> network-first
  event.respondWith(fetch(req).catch(() => caches.match(req)))
})

self.addEventListener('push', (event) => {
  let data = { title: 'ALPAZAR', body: 'Ke nje mesazh te ri!' }
  try { if (event.data) data = event.data.json() } catch { /* malformed push payload -> use defaults */ }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      vibrate: [200, 100, 200],
      tag: 'alpazar-notification',
      renotify: true,
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
