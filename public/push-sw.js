// PUSH-ONLY SERVICE WORKER — 5 shtator 2026.
//
// KUJDES FRESKIA (urdhër pronari): ky SW s'ka FETCH handler, s'thërret clients.claim,
// s'ka skipWaiting-për-kontroll dhe s'prek asnjë cache. Prandaj s'mund KURRË të
// ndërhyjë në navigim/asete → s'mund të shërbejë version të vjetër. Bug-u i vjetër
// "kthim te e vjetra" vinte VETËM nga një fetch handler që shërbente app-shell nga
// cache; këtu ai mekanizëm as ekziston.
//
// Regjistrohet me scope të NGUSHTË '/push-scope/' (shih lib/push.ts) → s'kontrollon
// asnjë faqe reale, ndaj `navigator.serviceWorker.controller` mbetet null dhe
// doktrina "asnjë SW s'kontrollon faqen → freski absolute" qëndron fjalë për fjalë.
// Push API i dorëzon ngjarjet 'push' te SW-ja e regjistrimit pavarësisht se s'kontrollon
// klientë (MDN Push API / W3C).

self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  var title = data.title || 'Alpazar';
  var body  = data.body || '';
  var url    = data.url || '/';
  event.waitUntil(self.registration.showNotification(title, {
    body: body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    lang: 'sq',
    data: { url: url },
    tag: data.tag || undefined,
    renotify: data.tag ? true : false
  }));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async function () {
    try {
      var all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (var i = 0; i < all.length; i++) {
        var c = all[i];
        try { if (c.url.indexOf(url) !== -1 && 'focus' in c) return c.focus(); } catch (e) {}
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    } catch (e) {}
  })());
});

// Rifreskim i abonimit kur shfletuesi e rrotullon (endpoint i ri) — s'prek freskinë.
self.addEventListener('pushsubscriptionchange', function (event) {
  // Riabonimi bëhet nga klienti në ngarkimin e radhës (lib/push subscribePush).
});
