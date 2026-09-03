'use client'

// Faqja e NJOFTIMIT TË PLOTË. Më parë tap-i i një njoftimi shkonte drejt te `link`
// (p.sh. pikët → /profile) ose s'bënte gjë kur s'kishte link — s'ekzistonte faqe që
// e hapte njoftimin të plotë (urdhër pronari, 3 shtator 2026). Tani çdo njoftim
// hapet këtu: titull + trup i plotë + koha + veprim kontekstual.

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { dateShort, clockTime } from '../../../lib/format'
import { useAlpazar } from '../../../lib/context'

type Notif = {
  id: string; type: string | null; title: string | null; body: string | null
  link: string | null; image_url: string | null; is_read: boolean | null
  created_at: string | null
}

export const dynamic = 'force-dynamic'

export default function NotificationDetail() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)
  const { authReady, refreshUnread } = useAlpazar()
  const [n, setN] = useState<Notif | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!authReady || !id) return
    let alive = true
    ;(async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id,type,title,body,link,image_url,is_read,created_at')
        .eq('id', id)
        .maybeSingle()
      if (!alive) return
      if (!data) { setNotFound(true); setLoading(false); return }
      setN(data as Notif)
      setLoading(false)
      if (!data.is_read) {
        await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id)
        refreshUnread?.()
      }
    })()
    return () => { alive = false }
  }, [authReady, id, refreshUnread])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .nd-wrap{max-width:760px;margin:0 auto;padding:0 0 80px;min-height:100vh;background:var(--az-cream);}
        .nd-head{background:linear-gradient(165deg,var(--az-yellow-hi),var(--az-yellow));position:sticky;top:0;z-index:20;padding:12px 14px;display:flex;align-items:center;gap:10px;}
        .nd-back{width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,.10);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--az-black);flex-shrink:0;}
        .nd-h{font-size:var(--fs-xl);font-weight:800;color:var(--az-black);margin:0;}
        .nd-card{background:var(--az-white);margin:14px;border-radius:16px;padding:20px 18px;box-shadow:var(--az-shadow-md);}
        .nd-title{font-size:var(--fs-2xl);font-weight:800;color:var(--az-black);line-height:1.25;margin:0 0 8px;}
        .nd-time{font-size:var(--fs-sm);color:var(--az-gray-1);margin-bottom:14px;}
        .nd-body{font-size:var(--fs-md);color:var(--az-ink);line-height:1.7;white-space:pre-wrap;word-break:break-word;}
        .nd-img{width:100%;border-radius:12px;margin-top:14px;}
        .nd-cta{display:inline-flex;align-items:center;gap:6px;margin-top:18px;background:var(--az-black);color:var(--az-yellow);border:none;border-radius:12px;padding:13px 20px;min-height:44px;font-size:var(--fs-md);font-weight:800;cursor:pointer;font-family:inherit;text-decoration:none;}
        .nd-msg{padding:40px 16px;text-align:center;color:var(--az-gray-1);}
        .nd-nf-t{font-weight:700;color:var(--az-black);margin-bottom:6px;}
        .nd-nf-s{font-size:var(--fs-sm);color:var(--az-gray-1);margin-bottom:14px;}
        @media(min-width:768px){ .nd-card{margin:22px;padding:26px 24px;} }
      ` }} />
      <div className="nd-wrap">
        <div className="nd-head">
          <button type="button" className="nd-back" aria-label="Kthehu te njoftimet"
            onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = '/notifications'))}>←</button>
          <h1 className="nd-h">Njoftim</h1>
        </div>

        {loading ? (
          <div className="nd-msg">Duke ngarkuar…</div>
        ) : notFound || !n ? (
          <div className="nd-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }} aria-hidden="true">🔕</div>
            <div className="nd-nf-t">Njoftimi nuk u gjet</div>
            <div className="nd-nf-s">Mund të jetë fshirë ose nuk të përket ty.</div>
            <a href="/notifications" className="nd-cta">← Të gjitha njoftimet</a>
          </div>
        ) : (
          <div className="nd-card">
            <h2 className="nd-title">{n.title || 'Njoftim'}</h2>
            <div className="nd-time">{n.created_at ? `${dateShort(n.created_at)} · ${clockTime(n.created_at)}` : ''}</div>
            {n.body && <div className="nd-body">{n.body}</div>}
            {n.image_url && <img src={n.image_url} alt="" className="nd-img" loading="lazy" />}
            {n.link && n.link.startsWith('/') && (
              <div>
                <a href={n.link} className="nd-cta">Vazhdo <span aria-hidden="true">→</span></a>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
