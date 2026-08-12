// Versioni merret AUTOMATIKISHT nga URL-ja e regjistrimit: /sw.js?v=<BUILD_ID>
// Kështu skedari ndryshon në çdo deploy -> shfletuesi e detekton përditësimin.
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev'
const CACHE_NAME = 'alpazar-' + VERSION

// KALIM I MENJËHERSHËM.
//
// Më parë këtu prisnim: versioni i ri instalohej dhe rrinte në pritje derisa
// të mbylleshin TË GJITHA skedat e faqes. Kush e mban panelin hapur nuk i
// mbyll kurrë — pra mbetej në versionin e vjetër pa fund, dhe një rifreskim
// i thjeshtë nuk e zgjidhte.
//
// Për një panel ku vendosen afate ligjore dhe lëshohen fatura, freskia vlen
// më shumë se mosndërprerja. `controllerchange` te layout-i e rifreskon faqen
// një herë të vetme kur kontrolli kalon.
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      // fshi ÇDO cache tjetër, përfshirë ato legacy që kishin ngecur
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  if (req.method !== 'GET') return

  // Paneli i administratës nuk sherbehet KURRE nga cache-i: aty vendosen
  // afate dhe para, dhe nje pamje e vjeter aty eshte me e keqe se asnje.
  if (url.pathname.startsWith('/admin')) {
    event.respondWith(fetch(req))
    return
  }

  // Navigime + API + Supabase -> network-first (HTML/të dhëna gjithmonë të freskëta)
  if (req.mode === 'navigate' || url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then(c => c || caches.match('/offline.html')))
    )
    return
  }

  // Asetet immutable të Next (emri përmban hash-in e përmbajtjes) -> cache-first.
  // I sigurt: një ndërtim i ri prodhon emra të rinj, ndaj kurrë nuk shërbehet i vjetri.
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

  // Branding/konfigurim -> network-first me cache:'reload'
  const sameOrigin = url.origin === self.location.origin
  const isBranding = sameOrigin && (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/manifest') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webmanifest') ||
    url.pathname === '/favicon.png' ||
    url.pathname === '/favicon.ico'
  )
  if (isBranding) {
    event.respondWith(
      fetch(req, { cache: 'reload' })
        .then(res => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then(ca => ca.put(req, copy))
          return res
        })
        .catch(() => caches.match(req))
    )
    return
  }

  // Media tjetër statike -> stale-while-revalidate
  if (/\.(js|css|png|jpg|jpeg|webp|gif|woff2?|ico|json)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(req).then(cached => {
          const network = fetch(req, { cache: 'reload' }).then(res => {
            cache.put(req, res.clone())
            return res
          }).catch(() => cached)
          return cached || network
        })
      )
    )
    return
  }

  event.respondWith(fetch(req).catch(() => caches.match(req)))
})

self.addEventListener('push', (event) => {
  let data = { title: 'ALPAZAR', body: 'Ke një mesazh të ri!' }
  try { if (event.data) data = event.data.json() } catch { /* payload i keq -> vlerat e parazgjedhura */ }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: data.url ? { url: data.url } : undefined,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) if ('focus' in c) return c.navigate(target).then(x => x.focus())
      if (self.clients.openWindow) return self.clients.openWindow(target)
    })
  )
})
