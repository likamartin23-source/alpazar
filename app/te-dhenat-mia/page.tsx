'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function TeDhenatMiaPage() {
  const [loading, setLoading]     = useState(true)
  const [userId, setUserId]       = useState<string | null>(null)
  const [profile, setProfile]     = useState<any>(null)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [msg, setMsg]             = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [marketingOpt, setMarketingOpt]   = useState(false)
  const [savingOpt, setSavingOpt]         = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      setUserId(session.user.id)
      // `marketing_opt_in` eshte mbyllur per leximin nder-perdorues; mbi veten
      // vjen i teri nga `my_profile()`.
      const { data: p } = await supabase.rpc('my_profile')
      if (p) {
        setProfile({ ...p, email: session.user.email })
        setMarketingOpt(p.marketing_opt_in ?? false)
      }
      setLoading(false)
    })
  }, [])

  async function exportData() {
    if (!userId) return
    setExporting(true)
    setMsg('')
    try {
      /*  Eksporti vjen nga `export_my_data()` — nje funksion i vetem ne baze qe
          mbledh TE GJITHA te dhenat e personit: profili, preferencat, shpalljet,
          blerjet, te preferuarat, kerkimet e ruajtura, njoftimet e cmimit,
          ndarjet, mesazhet e derguara DHE te marra, njoftimet — me bazen ligjore
          dhe shenimin e ruajtjes se faturave.

          Me pare kjo faqe e ndertonte vete eksportin me kater query, dhe rezultati
          ishte i mangët ne menyre qe shkelte vete te drejten qe pretendonte te
          plotesonte (neni 24, ligji 124/2024 — subjekti merr TE GJITHA te dhenat
          qe lidhen me te):
            · mesazhet nuk eksportoheshin fare — shkruhej vetem `messages_count`,
              dhe ai numer ishte i cunguar ne 200;
            · mungonin preferencat, blerjet, kerkimet e ruajtura, njoftimet e
              cmimit, ndarjet dhe njoftimet.
          Gjetur me 31 gusht 2026: funksioni ekzistonte ne baze prej kohesh dhe
          asnje rresht i nderfaqes nuk e therriste.  */
      const { data: eksporti, error: gabimEksporti } = await supabase.rpc('export_my_data')
      if (gabimEksporti) throw new Error(gabimEksporti.message)
      if ((eksporti as any)?.error) throw new Error((eksporti as any).error)

      const exportObj = eksporti

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `alpazar-data-${userId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMsg('ok:Të dhënat u eksportuan me sukses!')
    } catch (e: any) {
      setMsg(`err:Gabim gjatë eksportimit: ${e.message}`)
    }
    setExporting(false)
  }

  async function toggleMarketing(checked: boolean) {
    if (!userId) return
    setSavingOpt(true)
    const { error } = await supabase.from('profiles').update({ marketing_opt_in: checked }).eq('id', userId)
    setSavingOpt(false)
    if (error) { setMsg('err:Nuk u ruajt preferenca. Provo sërish.'); setTimeout(() => setMsg(''), 3000); return }
    setMarketingOpt(checked)
    setMsg(`ok:Preferencat e marketingut u ${checked ? 'aktivizuan' : 'çaktivizuan'}.`)
    setTimeout(() => setMsg(''), 3000)
  }

  async function deleteAccount() {
    if (!userId) return
    if (!deletePassword) { setMsg('err:Shkruaj fjalëkalimin për të konfirmuar.'); return }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setDeleting(true)
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: session.user.email!, password: deletePassword })
    if (authErr) { setMsg('err:Fjalëkalimi është i gabuar.'); setDeleting(false); return }
    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      await supabase.auth.signOut()
      window.location.href = '/?deleted=1'
    } catch (e: any) {
      setMsg(`err:${e.message}`)
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  /*  Gjendja e ngarkimit mban TE NJEJTIN skelet si faqja e ngarkuar.
   *  Me pare ishte nje rrotullues i centruar ne `100vh` me flex; kur permbajtja
   *  mberrinte, dokumenti kalonte nga nje kuti e centruar ne nje kolone 1080px
   *  dhe Chrome-i e numeronte si nje zhvendosje te vetme. Matur me 31 gusht
   *  2026: CLS = 0,333 ne desktop — mbi trefishin e pragut 0,1, nga NJE ngjarje
   *  e vetme ne 1447ms. Koka (55px) dhe kolona (480px) tani jane te pranishme
   *  qe ne fillim; skeleti mbulon trupin e matur (~1025px).  */
  if (loading) return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: 'var(--az-cream)', minHeight: '100vh', paddingBottom: 80, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <div style={{ background: 'linear-gradient(165deg,var(--az-yellow-hi) 0%,var(--az-yellow) 52%,var(--az-yellow-lo) 100%)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
        <button type="button" aria-label="Kthehu mbrapa" onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="ti ti-arrow-left" aria-hidden="true" style={{ fontSize: 22, color: '#111' }} />
        </button>
        <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800, color: '#111', margin: 0 }}>Të dhënat e mia</h1>
      </div>
      <div style={{ padding: 16 }} aria-busy="true" aria-label="Duke ngarkuar të dhënat">
        {[210, 150, 260, 190, 170].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: 14, background: '#f2ead0', opacity: 0.45, marginBottom: 12 }} />
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: 'var(--az-cream)', minHeight: '100vh', paddingBottom: 80, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(165deg,var(--az-yellow-hi) 0%,var(--az-yellow) 52%,var(--az-yellow-lo) 100%)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
        <button type="button" aria-label="Kthehu mbrapa" onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="ti ti-arrow-left" aria-hidden="true" style={{ fontSize: 22, color: '#111' }} />
        </button>
        <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: '#111', flex: 1, margin: 0 }}><span aria-hidden="true">🔒</span> Të dhënat e mia (GDPR)</h1>
      </div>

      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {msg && (
          <div role="alert" style={{ background: msg.startsWith('err:') ? '#FFF0EE' : '#F0FFF4', border: `1px solid ${msg.startsWith('err:') ? '#F09595' : '#86efac'}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: msg.startsWith('err:') ? 'var(--az-red-deep)' : '#166534', fontWeight: 600 }}>
            {msg.replace(/^(err:|ok:)/, '')}
          </div>
        )}

        {/* Who am I */}
        {profile && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4A4A4A', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Identiteti juaj në Alpazar</div>
            <div style={{ fontSize: 13, color: '#333', lineHeight: 2 }}>
              <div><span aria-hidden="true">👤</span> {profile.full_name || profile.username || 'Pa emër'}</div>
              {profile.city && <div><span aria-hidden="true">📍</span> {profile.city}</div>}
              <div><span aria-hidden="true">📅</span> Anëtar që nga {new Date(profile.created_at).toLocaleDateString('sq-AL')}</div>
            </div>
          </div>
        )}

        {/* Data rights */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4A4A4A', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}><span aria-hidden="true">📋</span> Të drejtat tuaja (GDPR)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#555', lineHeight: 1.6, marginBottom: 14 }}>
            <div><span aria-hidden="true">🔍</span> <strong>Art.15</strong> — E drejta e aksesit (shko tek profili yt)</div>
            <div><span aria-hidden="true">✏️</span> <strong>Art.16</strong> — E drejta e korrigjimit (edito profilin)</div>
            <div><span aria-hidden="true">🗑️</span> <strong>Art.17</strong> — E drejta e fshirjes ("E drejta e harresës")</div>
            <div><span aria-hidden="true">📦</span> <strong>Art.20</strong> — E drejta e portabilitetit (eksporto të dhënat)</div>
            <div><span aria-hidden="true">🚫</span> <strong>Art.21</strong> — E drejta e kundërshtimit (opt-out marketing)</div>
          </div>
          <button
            type="button"
            onClick={exportData}
            disabled={exporting}
            style={{ width: '100%', background: '#111', color: 'var(--az-yellow)', border: 'none', borderRadius: 11, padding: '12px 0', minHeight: 44, boxSizing: 'border-box', fontSize: 13, fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.6 : 1, fontFamily: 'inherit' }}
          >
            {exporting ? <><span aria-hidden='true'>⏳</span> Duke eksportuar...</> : <><span aria-hidden='true'>📥</span> Shkarko të dhënat e mia (JSON)</>}
          </button>
        </div>

        {/* Marketing opt-in */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4A4A4A', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}><span aria-hidden="true">📢</span> Komunikim marketing</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '4px 0', minHeight: 44 }}>
            <input
              type="checkbox"
              checked={marketingOpt}
              disabled={savingOpt}
              onChange={e => toggleMarketing(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--az-red)', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Pranoj njoftime marketingu</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2, lineHeight: 1.5 }}>Oferta speciale, lajme, këshilla. Mund ta heqësh kurdo. (GDPR Art.7 — konsensum i lirë)</div>
            </div>
          </label>
        </div>

        {/* Account deletion */}
        <div style={{ background: '#FFF0EE', borderRadius: 14, padding: 16, border: '1px solid #fca5a5' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}><span aria-hidden="true">⚠️</span> Zona e rrezikshme</div>
          <div style={{ fontSize: 12, color: '#555', marginBottom: 12, lineHeight: 1.6 }}>
            Fshirja e llogarisë është e pakthyeshme. Do të fshihen të gjitha shpalljet, mesazhet dhe të dhënat personale nga sistemi (GDPR Art.17).
          </div>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              style={{ width: '100%', background: 'transparent', color: 'var(--az-red-deep)', border: '1.5px solid var(--az-red-deep)', borderRadius: 11, padding: '11px 0', minHeight: 44, boxSizing: 'border-box', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <><span aria-hidden="true">🗑️</span> Fshi llogarinë time</>
            </button>
          ) : (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--az-red-deep)', marginBottom: 10 }}>Jeni i sigurt? Ky veprim NUK mund të kthehet!</div>
              <input
                id="delete-confirm-password"
                type="password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                placeholder="Shkruaj fjalëkalimin për të konfirmuar"
                aria-label="Fjalëkalimi për konfirmim fshirjeje"
                autoComplete="current-password"
                style={{ width: '100%', border: '1.5px solid var(--az-red-deep)', borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 10, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  style={{ flex: 1, background: '#f0f0f0', color: '#333', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}
                >
                  Anulo
                </button>
                <button
                  type="button"
                  onClick={deleteAccount}
                  disabled={deleting}
                  style={{ flex: 1, background: 'var(--az-red-deep)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1, fontFamily: 'inherit', minHeight: 44 }}
                >
                  {deleting ? <><span aria-hidden='true'>⏳</span> Duke fshirë...</> : 'Po, fshi!'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: '#555', lineHeight: 1.6, padding: '8px 0' }}>
          Për çdo kërkesë tjetër GDPR kontaktoni: <a href="mailto:alpazarsuport@gmail.com" style={{ color: '#C42B0F' }}>alpazarsuport@gmail.com</a>
          <br />
          Rregullorja (EU) 2016/679 · Ligj 9887/2008 (Shqipëri)
        </div>
      </div>
    </div>
  )
}
