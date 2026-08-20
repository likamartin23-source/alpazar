// SERVICE WORKER VETËSHKATËRRUES (kill-switch)
//
// PSE: Për muaj të tërë app-i shërbente "versionin e vjetër" në pajisjet e
// përdoruesve — me flake të shkurtra të së resë që kthehej me forcë te e vjetra.
// Shkaku themelor: një Service Worker/PWA cache që rimerrte kontrollin dhe
// shërbente app-shell-in e vjetër, ndërsa çdo garanci vetërregullimi rrinte
// brenda bundle-it të ri që SW-ja e vjetër s'e ngarkonte kurrë (kurthi klasik).
//
// ZGJIDHJA MË E FUQISHME DHE E GARANTUAR PËR FRESKI: hiqe SW-në krejt. Ky skedar
// tani NUK ka fetch-handler (s'ndërhyn më në asnjë kërkesë → çdo gjë shkon direkt
// në rrjet), fshin ÇDO cache, dhe ç'regjistron veten. Shfletuesi e merr këtë
// /sw.js përmes update-check-ut (shërbehet me `no-cache`, duke anashkaluar SW-në
// e vjetër); sapo aktivizohet, pastron gjithçka dhe largohet përgjithmonë.
//
// Pas kësaj: pa Service Worker → pa cache → shfletuesi merr gjithmonë nga rrjeti
// → header-at `no-store` (middleware + force-dynamic) garantojnë freski absolute.
// Regjistrimi i SW-së është hequr edhe nga faqja, ndaj s'rikrijohet dhe s'ka cikël.

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 1) Fshi ÇDO cache — pa përjashtim.
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
    } catch (e) { /* pa Cache API — vazhdo */ }

    // 2) Ç'regjistro këtë Service Worker përgjithmonë.
    try { await self.registration.unregister() } catch (e) { /* vazhdo */ }

    // 3) Rifresko një herë çdo skedë të hapur — TANI shërbehet nga rrjeti i pastër
    //    (pa SW, pa cache). Funksionon edhe për faqet e vjetra pa dëgjues.
    //    /admin përjashtohet që të mos ndërpritet një veprim ligjor në mes.
    //    S'ka cikël: faqja e re s'e regjistron më SW-në, ndaj kjo ndodh një herë.
    try {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const c of clients) {
        try {
          const u = new URL(c.url)
          if (u.origin !== self.location.origin) continue
          if (u.pathname.startsWith('/admin')) continue
          if ('navigate' in c) await c.navigate(c.url)
        } catch (e) { /* skedë e pa-navigueshme */ }
      }
    } catch (e) { /* pa clients API */ }
  })())
})

// PA fetch-handler qëllimisht: SW-ja nuk ndërhyn në asnjë kërkesë. Çdo navigim,
// aset apo API shkon DIREKT te rrjeti — kurrë nga një cache i vjetër.
