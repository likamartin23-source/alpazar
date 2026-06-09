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
  const [marketingOpt, setMarketingOpt]   = useState(false)
  const [savingOpt, setSavingOpt]         = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      setUserId(session.user.id)
      const { data: p } = await supabase
        .from('profiles')
        .select('full_name,username,email,city,created_at,marketing_opt_in')
        .eq('id', session.user.id)
        .single()
      if (p) {
        setProfile(p)
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
      const [profileRes, listingsRes, favoritesRes, messagesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('listings').select('id,title,price,currency,city,created_at,is_active').eq('user_id', userId),
        supabase.from('favorites').select('listing_id,created_at').eq('user_id', userId),
        supabase.from('messages').select('id,content,created_at,is_read').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).limit(200),
      ])

      const exportObj = {
        exported_at: new Date().toISOString(),
        platform: 'ALPAZAR — alpazar.vercel.app',
        gdpr_basis: 'GDPR Art.20 — E drejta e portabilitetit të të dhënave',
        profile: profileRes.data,
        listings: listingsRes.data || [],
        favorites: favoritesRes.data || [],
        messages_count: messagesRes.data?.length || 0,
      }

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
    await supabase.from('profiles').update({ marketing_opt_in: checked }).eq('id', userId)
    setMarketingOpt(checked)
    setSavingOpt(false)
    setMsg(`ok:Preferencat e marketingut u ${checked ? 'aktivizuan' : 'çaktivizuan'}.`)
    setTimeout(() => setMsg(''), 3000)
  }

  async function deleteAccount() {
    if (!userId) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setDeleting(true)
    try {
      const FN_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.functions.supabase.co') + '/delete-account'
      const res = await fetch(FN_URL, {
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

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FFFBEA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #F5C842', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#FFFBEA', minHeight: '100vh', paddingBottom: 80, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg,#F5C842,#f0bc30)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 22, color: '#111' }} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111', flex: 1 }}>🔒 Të dhënat e mia (GDPR)</span>
      </div>

      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {msg && (
          <div style={{ background: msg.startsWith('err:') ? '#FFF0EE' : '#F0FFF4', border: `1px solid ${msg.startsWith('err:') ? '#F09595' : '#86efac'}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: msg.startsWith('err:') ? '#E63312' : '#166534', fontWeight: 600 }}>
            {msg.replace(/^(err:|ok:)/, '')}
          </div>
        )}

        {/* Who am I */}
        {profile && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Identiteti juaj në Alpazar</div>
            <div style={{ fontSize: 13, color: '#333', lineHeight: 2 }}>
              <div>👤 {profile.full_name || profile.username || 'Pa emër'}</div>
              {profile.city && <div>📍 {profile.city}</div>}
              <div>📅 Anëtar që nga {new Date(profile.created_at).toLocaleDateString('sq-AL')}</div>
            </div>
          </div>
        )}

        {/* Data rights */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>📋 Të drejtat tuaja (GDPR)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#555', lineHeight: 1.6, marginBottom: 14 }}>
            <div>🔍 <strong>Art.15</strong> — E drejta e aksesit (shko tek profili yt)</div>
            <div>✏️ <strong>Art.16</strong> — E drejta e korrigjimit (edito profilin)</div>
            <div>🗑️ <strong>Art.17</strong> — E drejta e fshirjes ("E drejta e harresës")</div>
            <div>📦 <strong>Art.20</strong> — E drejta e portabilitetit (eksporto të dhënat)</div>
            <div>🚫 <strong>Art.21</strong> — E drejta e kundërshtimit (opt-out marketing)</div>
          </div>
          <button
            onClick={exportData}
            disabled={exporting}
            style={{ width: '100%', background: '#111', color: '#F5C842', border: 'none', borderRadius: 11, padding: '12px 0', fontSize: 13, fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.6 : 1, fontFamily: 'inherit' }}
          >
            {exporting ? '⏳ Duke eksportuar...' : '📥 Shkarko të dhënat e mia (JSON)'}
          </button>
        </div>

        {/* Marketing opt-in */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>📢 Komunikim marketing</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '4px 0' }}>
            <input
              type="checkbox"
              checked={marketingOpt}
              disabled={savingOpt}
              onChange={e => toggleMarketing(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: '#E63312', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Pranoj njoftime marketingu</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2, lineHeight: 1.5 }}>Oferta speciale, lajme, këshilla. Mund ta heqësh kurdo. (GDPR Art.7 — konsensum i lirë)</div>
            </div>
          </label>
        </div>

        {/* Account deletion */}
        <div style={{ background: '#FFF0EE', borderRadius: 14, padding: 16, border: '1px solid #fca5a5' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>⚠️ Zona e rrezikshme</div>
          <div style={{ fontSize: 12, color: '#555', marginBottom: 12, lineHeight: 1.6 }}>
            Fshirja e llogarisë është e pakthyeshme. Do të fshihen të gjitha shpalljet, mesazhet dhe të dhënat personale nga sistemi (GDPR Art.17).
          </div>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ width: '100%', background: 'transparent', color: '#dc2626', border: '1.5px solid #dc2626', borderRadius: 11, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              🗑️ Fshi llogarinë time
            </button>
          ) : (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 10 }}>Jeni i sigurt? Ky veprim NUK mund të kthehet!</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{ flex: 1, background: '#f0f0f0', color: '#333', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Anulo
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={deleting}
                  style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1, fontFamily: 'inherit' }}
                >
                  {deleting ? '⏳ Duke fshirë...' : 'Po, fshi!'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: '#888', lineHeight: 1.6, padding: '8px 0' }}>
          Për çdo kërkesë tjetër GDPR kontaktoni: <a href="mailto:privacy@alpazar.al" style={{ color: '#E63312' }}>privacy@alpazar.al</a>
          <br />
          Rregullorja (EU) 2016/679 · Ligj 9887/2008 (Shqipëri)
        </div>
      </div>
    </div>
  )
}
