// Ndihmës i vogël për gjurmimin e ngjarjeve të analitikës (BLLOKU I PËRMIRËSUAR).
// Fire-and-forget: kurrë s'e prish faqen; dështimi injorohet. Për impresionet
// përdor dedupe 1×/sesion/shpallje (që një kartë e parë disa herë të mos numërohet
// shumëfish). `keepalive` lejon dërgimin edhe kur faqja po mbyllet (p.sh. klik dalës).

type Kind = 'impression' | 'share' | 'contact_whatsapp' | 'contact_viber' | 'contact_phone' | 'notify'

export function trackEvent(kind: Kind, listingId?: string | null, opts?: { once?: boolean }) {
  if (typeof window === 'undefined' || !listingId) return
  try {
    if (opts?.once) {
      const k = `_alpz_ev_${kind}_${listingId}`
      try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1') } catch { /* private mode */ }
    }
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, listing_id: listingId }),
      keepalive: true,
    }).catch(() => { /* fail-soft */ })
  } catch { /* fail-soft */ }
}
