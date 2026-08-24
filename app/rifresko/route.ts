import { NextResponse } from 'next/server'

// RRUGA DEFINITIVE E SHPËTIMIT — `/rifresko`
//
// Shtresa e fundit e garancisë kundër "1s e re → kthim te e vjetra": çdo pajisje
// e ngecur (SW i vjetër + cache i vjetër, sidomos Brave/DDG/PWA) shpëton duke hapur
// NJË herë këtë link — pa DevTools, pa pastrim manual.
//
// Si punon (dy mekanizma të pavarur, belt-and-suspenders):
//  1) Header `Clear-Site-Data: "cache","storage"` → browser-i fshin cache-t, Cache
//     Storage, regjistrimet e Service Worker-it, localStorage/IndexedDB. Vlen kur
//     browser-i e merr këtë përgjigje nga RRJETI — dhe meqë `/rifresko` është rrugë
//     e re që SW-ja e vjetër s'e ka në cache, kërkesa shkon te rrjeti → header-i zbatohet.
//  2) Skript inline që çregjistron SW + fshin cache-t (nëse header-i s'mbulohet nga
//     shfletuesi), pastaj ridrejton te `/` me cache-bust.
//
// force-dynamic + no-store: kjo faqe s'ruhet kurrë. Additive; s'prek pagesat/RLS.
// KUJDES: `"storage"` çkyç sesionin (fshin edhe cookie/localStorage) — kjo është
// e qëllimshme: është "reset i plotë" me vullnet të përdoruesit.

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

const HTML = `<!doctype html>
<html lang="sq">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Rifreskim — ALPAZAR</title>
</head>
<body style="margin:0;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;background:#FFFBEA;color:#111;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center">
<div style="max-width:440px;padding:24px">
<div style="font-size:44px" aria-hidden="true">✨</div>
<h1 style="font-size:21px;margin:14px 0 8px;font-weight:800">Po pastrojmë versionin e vjetër…</h1>
<p style="font-size:14px;color:#555;line-height:1.55">U hoqën cache-t dhe Service Worker-i i ngecur. Po të kthejmë te Alpazar me versionin më të ri. Nëse s'ndodh vetë, prek butonin.</p>
<a href="/" style="display:inline-block;margin-top:16px;background:#F5C842;color:#111;font-weight:800;text-decoration:none;padding:11px 22px;border-radius:11px;font-size:14px">Hap Alpazar →</a>
</div>
<script>
(function(){
  var went=false;
  function go(){ if(went) return; went=true; try{ location.replace('/?fresh='+Date.now()); }catch(e){ try{ location.href='/'; }catch(_){} } }
  try{
    var tasks=[];
    if ('serviceWorker' in navigator) {
      tasks.push(navigator.serviceWorker.getRegistrations().then(function(rs){
        return Promise.all(rs.map(function(r){ return r.unregister().catch(function(){}); }));
      }).catch(function(){}));
    }
    if (window.caches && caches.keys) {
      tasks.push(caches.keys().then(function(ks){
        return Promise.all(ks.map(function(k){ return caches.delete(k).catch(function(){}); }));
      }).catch(function(){}));
    }
    Promise.all(tasks).then(function(){ setTimeout(go, 500); }, function(){ setTimeout(go, 500); });
    setTimeout(go, 2500); // fallback absolut
  } catch(e){ go(); }
})();
</script>
</body>
</html>`

export async function GET() {
  return new NextResponse(HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      // Fshin cache + storage + regjistrimet e Service Worker-it në shfletuesit që e mbështesin.
      'Clear-Site-Data': '"cache", "storage"',
    },
  })
}
