// SERVICE WORKER VETËSHKATËRRUES (kill-switch) — PA RINGARKIM.
//
// PSE: Për muaj të tërë app-i shërbente "versionin e vjetër" me flake që kthehej
// te i vjetri. Dy shkaqe u gjetën e u hoqën: (1) UpdatePrompt që ringarkonte
// faqen vetvetiu; (2) edge-cache/SW që shërbente HTML të vjetër. Ky skedar heq
// Service Worker-in krejt.
//
// KUJDES I VEÇANTË: versioni i mëparshëm i kill-switch-it bënte `client.navigate()`
// (një ringarkim) në `activate`. Për një pajisje me HTML të vjetër ende në cache,
// ai ringarkim mund të hynte në cikël (HTML i vjetër -> riregjistron SW -> kill
// -> navigate -> HTML i vjetër ...). Prandaj TANI kill-switch-i vetëshkatërrohet
// NË HESHTJE: fshin çdo cache, çregjistron veten, dhe NUK ringarkon. Faqja
// përditësohet vetvetiu në navigimin/rifreskimin e radhës — pa Service Worker,
// çdo kërkesë shkon te rrjeti dhe `no-store` garanton freskinë. Zero ringarkim
// automatik kudo => zero cikël "flicker->old".

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
    } catch (e) { /* pa Cache API — vazhdo */ }
    try { await self.clients.claim() } catch (e) { /* vazhdo */ }
    try { await self.registration.unregister() } catch (e) { /* vazhdo */ }
    // PA client.navigate()/reload — vetëshkatërrim i heshtur.
  })())
})

// PA fetch-handler: SW-ja nuk ndërhyn në asnjë kërkesë. Çdo navigim/aset/API
// shkon DIREKT te rrjeti — kurrë nga një cache i vjetër.
