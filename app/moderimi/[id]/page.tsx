'use client'

export const dynamic = 'force-dynamic'

// Faqja ku PRONARI i shpalljes sheh arsyetimin e vendimit dhe ankohet.
//
// Pa këtë faqe, njoftimi që dërgon `tg_moderation_notify_owner` do të ishte
// lidhje e vdekur. Të dhënat vijnë nga `my_moderation_case()` — jo drejt nga
// `moderation_queue`, sepse RLS e asaj tabele është vetëm-admin dhe pronari
// s'e lexon dot rastin e vet.

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { dateShort, clockTime } from '../../../lib/format'

const inputStyle = {
  width: '100%', border: '1.5px solid #ddd', borderRadius: 8, padding: '10px 12px',
  fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const,
  minHeight: 110, resize: 'vertical' as const,
}

const MIN_ARSYE = 20

function dt(v: string | null) {
  if (!v) return '—'
  // Determinist (pa ICU): "09 gush 2026 · 14:05". clockTime jep orën lokale — vetëm pas mount.
  const d = dateShort(v)
  return d ? `${d} · ${clockTime(v)}` : '—'
}

export default function ModerimiPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [rasti, setRasti]   = useState<any>(null)
  const [gabim, setGabim]   = useState('')
  const [duke, setDuke]     = useState(true)
  const [arsyeja, setArsyeja] = useState('')
  const [dergon, setDergon] = useState('')

  const ngarko = useCallback(async () => {
    if (!id) return
    const { data: s } = await supabase.auth.getSession()
    if (!s?.session) { setGabim('pa_autentikim'); setDuke(false); return }

    const { data, error } = await supabase.rpc('my_moderation_case', { p_id: id })
    setDuke(false)
    if (error) { setGabim(error.message); return }
    if ((data as any)?.error) { setGabim((data as any).error); return }
    setRasti(data); setGabim('')
  }, [id])

  useEffect(() => { ngarko() }, [ngarko])

  async function dergoAnkimin() {
    if (arsyeja.trim().length < MIN_ARSYE) {
      setDergon(`Shkruaj të paktën ${MIN_ARSYE} karaktere — arsyetimi yt shqyrtohet nga një person.`)
      return
    }
    setDergon('duke')
    const { data, error } = await supabase.rpc('submit_appeal', {
      p_queue_id: id, p_arsyeja: arsyeja.trim(),
    })
    if (error || (data as any)?.error) {
      const k = (data as any)?.error
      setDergon(
        k === 'ankim_ekzistues' ? 'Ke dorëzuar tashmë një ankim për këtë rast.'
        : k === 'nuk_je_pronari' ? 'Vetëm pronari i shpalljes mund të ankohet.'
        : k === 'arsyeja_e_shkurter' ? `Arsyeja duhet të ketë të paktën ${MIN_ARSYE} karaktere.`
        : (error?.message || 'Ankimi nuk u dorëzua. Provo sërish.')
      )
      return
    }
    setDergon(''); setArsyeja(''); ngarko()
  }

  const wrap = (inner: React.ReactNode) => (
    <div style={{ minHeight: '100dvh', background: 'var(--az-cream)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <button type="button" aria-label="Kthehu" onClick={() => window.history.back()}
          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Kthehu
        </button>
        <div style={{ background: '#fff', border: '1.5px solid #f0e6b0', borderRadius: 16, padding: 28 }}>
          {inner}
        </div>
        <p style={{ fontSize: 10.5, color: '#555', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
          Çdo masë ndaj përmbajtjes merret nga një person dhe shoqërohet me arsyetim.
          Shih <a href="/kushtet" style={{ color: '#555' }}>Kushtet</a> dhe{' '}
          <a href="/privatesia" style={{ color: '#555' }}>Privatësinë</a>.
        </p>
      </div>
    </div>
  )

  if (duke) return wrap(<div style={{ fontSize: 13, color: '#555' }}>Duke ngarkuar…</div>)

  if (gabim) {
    const teksti =
      gabim === 'pa_autentikim'  ? 'Hyr në llogari për ta parë këtë vendim.'
      : gabim === 'nuk_je_pronari' ? 'Ky vendim nuk lidhet me një shpallje tënden.'
      : gabim === 'nuk_u_gjet'     ? 'Ky rast nuk u gjet.'
      : gabim
    return wrap(
      <>
        <h1 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: '#111', marginBottom: 8 }}>Vendimi i moderimit</h1>
        <div role="alert" style={{ background: '#FFF0EE', color: '#C42B0F', border: '1px solid #F09595', borderRadius: 8, padding: '10px 12px', fontSize: 12.5 }}>{teksti}</div>
        {gabim === 'pa_autentikim' && (
          <a href="/auth/login" style={{ display: 'inline-block', marginTop: 12, background: '#111', color: '#fff', borderRadius: 10, padding: '11px 18px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Hyr</a>
        )}
      </>
    )
  }

  const hequr = rasti?.status === 'resolved'
  const ank   = rasti?.ankimi

  return wrap(
    <>
      <h1 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: '#111', marginBottom: 6 }}>
        {hequr ? 'Shpallja jote u hoq' : 'Shpallja jote u shqyrtua — pa masë'}
      </h1>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 18 }}>
        {rasti?.listing_titull ? <>„{rasti.listing_titull}" · </> : null}{dt(rasti?.vendosur_me)}
      </div>

      <div style={{ background: '#FBF7E8', border: '1px solid #f0e6b0', borderRadius: 10, padding: 14, marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#4A4A4A', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Arsyetimi</div>
        <div style={{ fontSize: 13, color: '#111', lineHeight: 1.65 }}>
          {rasti?.arsyetimi || 'Pa arsyetim të regjistruar.'}
        </div>
      </div>

      {ank ? (
        <div style={{
          background: ank.status === 'accepted' ? '#EAF3DE' : ank.status === 'rejected' ? '#FFF0EE' : '#FFF8E1',
          border: `1px solid ${ank.status === 'accepted' ? '#97C459' : ank.status === 'rejected' ? '#F09595' : '#FFB74D'}`,
          borderRadius: 10, padding: 14,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 6 }}>
            {ank.status === 'pending'  ? 'Ankimi yt është në shqyrtim'
             : ank.status === 'accepted' ? 'Ankimi u pranua — shpallja u rikthye'
             : 'Ankimi u refuzua'}
          </div>
          <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>
            Dorëzuar më {dt(ank.krijuar_me)}. „{ank.arsyeja}"
          </div>
          {ank.pergjigjja && (
            <div style={{ fontSize: 12.5, color: '#111', marginTop: 10, lineHeight: 1.6 }}>
              <strong>Përgjigjja:</strong> {ank.pergjigjja}
            </div>
          )}
          {ank.status === 'pending' && (
            <div style={{ fontSize: 11.5, color: '#555', marginTop: 8, lineHeight: 1.55 }}>
              Ankimin e shqyrton një moderator tjetër, jo ai që mori vendimin e parë.
            </div>
          )}
        </div>
      ) : rasti?.mund_te_ankohet ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 6 }}>Nuk je dakord?</div>
          <p style={{ fontSize: 12, color: '#555', lineHeight: 1.6, marginBottom: 10 }}>
            Shpjego pse mendon se vendimi është i gabuar. Ankimin e shqyrton{' '}
            <strong>një moderator tjetër</strong>, jo ai që mori vendimin e parë.
          </p>
          <textarea
            aria-label="Arsyeja e ankimit"
            value={arsyeja}
            onChange={e => { setArsyeja(e.target.value); if (dergon && dergon !== 'duke') setDergon('') }}
            placeholder="P.sh. shpallja nuk shkel asnjë rregull sepse…"
            style={inputStyle}
          />
          <div style={{ fontSize: 10.5, color: arsyeja.trim().length >= MIN_ARSYE ? '#3B6D11' : '#555', marginTop: 4 }}>
            {arsyeja.trim().length}/{MIN_ARSYE} karaktere minimale
          </div>

          {dergon && dergon !== 'duke' && (
            <div role="alert" style={{ background: '#FFF0EE', color: '#C42B0F', border: '1px solid #F09595', borderRadius: 8, padding: '10px 12px', fontSize: 12, marginTop: 10 }}>{dergon}</div>
          )}

          <button
            type="button"
            onClick={dergoAnkimin}
            disabled={dergon === 'duke'}
            style={{ width: '100%', marginTop: 12, background: '#111', color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: dergon === 'duke' ? 0.7 : 1 }}
          >
            {dergon === 'duke' ? 'Duke dërguar…' : 'Dërgo ankimin'}
          </button>
        </>
      ) : (
        <div style={{ fontSize: 12.5, color: '#555', lineHeight: 1.6 }}>
          Për këtë rast nuk ka masë ndaj shpalljes, ndaj nuk ka çfarë të ankimohet.
        </div>
      )}
    </>
  )
}
