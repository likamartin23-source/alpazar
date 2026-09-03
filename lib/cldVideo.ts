// ── Kap gjerësie/cilësie te URL-ja e videos Cloudinary NË DORËZIM ────────────
//
// PSE: videot ngarkohen te Cloudinary me URL dorëzimi `.../video/upload/
// f_mp4,vc_h264,q_auto/<pid>.mp4` — pa kap gjerësie. Kështu edhe një kartë feed-i
// ~300px tërheq videon në rezolucionin e plotë të burimit (matur: shpallje deri
// ~7 MB). Zgjidhja NUK është ta ngulisim gjerësinë te URL-ja e ruajtur (do ta
// dëmtonte pamjen e plotë dhe s'do t'i prekte videot ekzistuese), por ta shtojmë
// transformimin NË DORËZIM, sipas kontekstit: feed → i vogël, pamje e plotë → i
// madh. I njëjti burim, dy madhësi. Cloudinary e aplikon fluturimthi nga URL-ja.
//
// `c_limit` → kurrë nuk e zmadhon (video e vogël mbetet e vogël). Idempotent:
// nëse URL-ja e ka tashmë një kap `w_`, kthehet e paprekur. URL jo-Cloudinary
// (blob preview, Supabase storage, Cloudflare Stream) kthehen si janë.
export function cldVideo(url: string | null | undefined, width: number, eco = false): string {
  if (!url) return url || ''
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)([^/]+)\/(.+)$/)
  if (!m) return url
  const [, head, seg, tail] = m
  if (!seg.includes('_')) return url // segment jo-transformim (URL pa transform) → mos e prek
  const parts = seg.split(',')
  if (parts.some(p => /^w_\d/.test(p))) return url // tashmë me kap gjerësie → idempotent
  parts.push(`w_${width}`, 'c_limit')
  const out = eco ? parts.map(p => (p === 'q_auto' ? 'q_auto:eco' : p)) : parts
  return `${head}${out.join(',')}/${tail}`
}
