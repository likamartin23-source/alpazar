// CACHE_NAME ndryshon me çdo deploy — shfletuesi e njeh ndryshimin dhe rifrekon cache
const CACHE_NAME = 'alpazar-v4'
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (e) => {
  // skipWaiting: SW i ri aktivizohet menjëherë pa pritur mbylljen e tab-it
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {})
    )
  )
})

self.addEventListener('activate', (e) => {
  // Fshi të gjitha cache-t e vjetra (v1, v2, etj.)
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Kalo: jo-GET, supabase, API, Next.js chunks (kane hash unik per deploy)
  if (request.method !== 'GET') return
  if (url.hostname.includes('supabase.co')) return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/_next/')) return  // Next.js chunks — mos i cache (jane hashed)

  // NETWORK-FIRST per te gjitha faqet — gjithmonë version i ri nga serveri
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((res) => res)
        .catch(() => caches.match('/').then((r) => r || new Response('Offline', { status: 503 })))
    )
    return
  }

  // Cache-first VETEM per assets statike (ikona, manifest)
  if (url.pathname.startsWith('/icons/') || url.pathname === '/manifest.json') {
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((res) => {
          if (res.ok) caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()))
          return res
        })
      })
    )
    return
  }

  // Te gjitha te tjerat: network-first, pa cache
  e.respondWith(fetch(request).catch(() => new Response('', { status: 503 })))
})

// SKIP_WAITING: lejon faqen te rifreskohet automatikisht kur ka version te ri
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting()
})

// Push notifications
self.addEventListener('push', (e) => {
  const data = e.data?.json() || { title: 'ALPAZAR', body: 'Ke një mesazh të ri!' }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      vibrate: [200, 100, 200],
      tag: 'alpazar-notification',
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(clients.openWindow('/'))
})
