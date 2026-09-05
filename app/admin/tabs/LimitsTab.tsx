'use client'

/**
 * KONFIGURIMI — NJE EKRAN I VETEM
 *
 * Me pare kishte DY skeda me te njejten leje 'config.write':
 *   ['limits', 'Kufijtë']  dhe  ['config', 'Konfigurime']
 * Ndarja nuk ishte konceptuale, ishte historike: ekzistojne dy tabela
 * konfigurimi — app_config (34 celesa) dhe admin_settings (52). Paneli
 * pasqyroi tabelat ne vend qe te pasqyronte punen.
 *
 * Dhe ato kishin rene ne kundershti:
 *   app_config.google_client_id       = 671603193816-umu48bc9...
 *   admin_settings.google_oauth_client_id = 671603193816-i8gh90bu...
 * Dy vlera te NDRYSHME per te njejten gje. Cila lexohet, vendos nese hyrja
 * me Google punon.
 *
 * Tani: nje ekran, shtate seksione, nje burim. Shkrimi kalon nga
 * admin_config_set(), i cili shkruan VETE ne depon e duhur — dhe kur celesi
 * ndodhet ne te dyja, i perditeson te dyja, qe divergjenca te mos rilinde.
 * Cdo ndryshim shkon edhe te gjurma (admin_log).
 */

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

type Celes = {
  celesi: string
  vlera: string
  sekret: boolean
  depoja: 'app_config' | 'admin_settings'
  e_vendosur: boolean
}

type Perplasje = { celesi: string; app_config: string; admin_settings: string; ndryshojne: boolean }
type Dublikate = { app_config: string; admin_settings: string; ndryshojne: boolean }

type Konfigurimi = {
  seksione: Record<string, Celes[]>
  perplasje: Perplasje[]
  dublikate_te_ngjashme: Dublikate[]
  mungojne_te_detyrueshme: string[] | null
  error?: string
}

// Pershkrime njerezore per celesat qe kane rendesi. Te tjeret shfaqen si jane.
const SHPJEGIM: Record<string, string> = {
  free_listings_limit: 'Sa shpallje aktive lejohen pa pagesë',
  max_images_free: 'Foto për shpallje — llogari pa pagesë',
  max_images_premium: 'Foto për shpallje — Premium. −1 = pa limit',
  free_videos_limit: 'Video për shpallje — llogari pa pagesë',
  max_videos_premium: 'Video për shpallje — Premium',
  video_max_seconds: 'Kohëzgjatja maksimale e videos, në sekonda',
  max_listings_per_day: 'Shpallje në 24 orë. Ndal shpërthimet e spam-it',
  min_listing_price: 'Çmimi minimal. 0 = lejo “me marrëveshje”',
  business_requires_premium: 'Kur Premium-i bie, profili i biznesit errësohet vetvetiu',
  invoice_autosend: 'Fatura shkon vetë në inbox kur aprovohet pagesa',
  subscription_grace_days: 'Ditë tolerance pas skadimit të abonimit',
  company_nipt: 'I detyrueshëm për faturën — ligji 87/2019',
  company_address: 'E detyrueshme për faturën — ligji 87/2019',
  invoice_vat_rate: 'Norma e TVSH-së. Çmimet janë me TVSH të përfshirë',
  default_currency: 'Monedha e parazgjedhur e faturave',
  fiscal_enabled: 'Kërkon faturë tatimore para se të dërgohet te klienti',
  takedown_sla_illegal_hours: 'Afati për përmbajtje të paligjshme — neni 17/1/b',
  takedown_sla_ip_hours: 'Afati për njoftimet e pronësisë intelektuale',
  ai_moderation_enabled: 'Moderimi automatik i shpalljeve të reja',
  announcement_active: 'Njoftimi shfaqet në krye të çdo faqeje',
  announcement_text: 'Çfarë lexojnë përdoruesit',
  announcement_level: 'info · sukses · kujdes',
  maintenance_mode: 'Mbyll faqen për të gjithë përveç administratës',
}

const BOOL = (v: string) => v === 'true' || v === 'false'
const cap = (v?: string) => (String(v) === '-1' ? '∞' : v && v !== '' ? v : '—')

export function LimitsTab() {
  const [k, setK] = useState<Konfigurimi | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState('')
  const [ok, setOk] = useState('')
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_config')
    if (error) { setErr(error.message); return }
    if ((data as Konfigurimi)?.error) { setErr((data as Konfigurimi).error!); return }
    setK(data as Konfigurimi)
    setDraft({})
  }, [])

  useEffect(() => { load() }, [load])

  async function ruaj(celesi: string, vlera: string) {
    setBusy(celesi); setErr(''); setOk('')
    const { data, error } = await supabase.rpc('admin_config_set', {
      p_key: celesi, p_value: vlera,
    })
    setBusy('')
    if (error) { setErr(error.message); return }
    if ((data as any)?.error) { setErr((data as any).error); return }
    setOk(celesi); setTimeout(() => setOk(''), 2500)
    await load()
  }

  const gjej = (celesi: string): Celes | undefined => {
    if (!k) return undefined
    for (const rreshtat of Object.values(k.seksione || {})) {
      const x = rreshtat.find(r => r.celesi === celesi)
      if (x) return x
    }
    return undefined
  }
  const v = (celesi: string) => gjej(celesi)?.vlera ?? ''

  if (err && !k) {
    return (
      <div className="card" role="alert" style={{ borderColor: '#F09595', background: '#FFF0EE', color: '#C42B0F', fontSize: 'var(--fs-dysheme)' }}>
        {err}
      </div>
    )
  }
  if (!k) return <div className="card">Duke ngarkuar konfigurimin…</div>

  const seksionet = Object.keys(k.seksione || {}).sort()
  const mungojne = k.mungojne_te_detyrueshme || []
  const perplasje = (k.perplasje || []).filter(p => p.ndryshojne)
  const dublikate = (k.dublikate_te_ngjashme || []).filter(d => d.ndryshojne)

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">⚙️</span> Konfigurimi</div>
        <div className="live-dot">Një burim i vetëm</div>
      </div>

      <div className="stats">
        <div className="sc"><div className="sn">{cap(v('free_listings_limit'))}</div><div className="sl">Shpallje falas</div></div>
        <div className="sc"><div className="sn">{cap(v('max_images_free'))}</div><div className="sl">Foto falas</div></div>
        <div className="sc"><div className="sn">{cap(v('max_images_premium'))}</div><div className="sl">Foto Premium</div></div>
        <div className="sc"><div className="sn">{cap(v('max_videos_premium'))}</div><div className="sl">Video Premium</div></div>
      </div>

      {err && (
        <div className="card" role="alert" style={{ borderColor: '#F09595', background: '#FFF0EE', color: '#C42B0F', fontSize: 'var(--fs-dysheme)' }}>{err}</div>
      )}

      {mungojne.length > 0 && (
        <div className="card" style={{ borderColor: '#F0C36D', background: '#FFF8E8' }}>
          <div className="ct">Mungojnë të dhëna të detyrueshme</div>
          <div style={{ fontSize: 'var(--fs-dysheme)', color: '#8A6D1F', lineHeight: 1.8 }}>
            Pa këto, fatura nuk e përmbush ligjin 87/2019 dhe fiskalizimi nuk ndizet dot:
            <b> {mungojne.join(' · ')}</b>
          </div>
        </div>
      )}

      {(perplasje.length > 0 || dublikate.length > 0) && (
        <div className="card" style={{ borderColor: '#F09595', background: '#FFF0EE' }}>
          <div className="ct">Përplasje mes dy depove</div>
          <div style={{ fontSize: 'var(--fs-dysheme)', color: '#C42B0F', lineHeight: 1.8 }}>
            I njëjti koncept ruhet në dy vende me vlera të ndryshme. Cila lexohet, vendos sjelljen:
            <ul style={{ margin: '8px 0 0 16px' }}>
              {perplasje.map(p => <li key={p.celesi}><code>{p.celesi}</code></li>)}
              {dublikate.map(d => (
                <li key={d.app_config}><code>{d.app_config}</code> ↔ <code>{d.admin_settings}</code></li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {seksionet.map(emri => (
        <div className="card" key={emri}>
          <div className="ct">{emri.replace(/^\d+\.\s*/, '')}</div>
          {(k.seksione[emri] || []).map(rreshti => {
            const c = rreshti.celesi
            const iRuajtur = rreshti.vlera ?? ''
            const cur = draft[c] ?? (rreshti.sekret ? '' : iRuajtur)
            const dirty = rreshti.sekret ? cur.length > 0 : String(cur) !== String(iRuajtur)
            const on = iRuajtur === 'true'

            return (
              <div className="cfg-row" key={c}>
                <div className="cfg-label">
                  {c}
                  <div className="cfg-desc">
                    {SHPJEGIM[c] || (rreshti.sekret ? 'Sekret — shfaqet i maskuar' : '\u00A0')}
                  </div>
                </div>

                {BOOL(iRuajtur) ? (
                  <button type="button" aria-pressed={on} disabled={busy === c}
                    className={`tgl ${on ? 'tgl-on' : 'tgl-off'}`} aria-label={c}
                    onClick={() => ruaj(c, on ? 'false' : 'true')}>
                    <span className="tdot" />
                  </button>
                ) : (
                  <div style={{ width: 250, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input className="finput" type={rreshti.sekret ? 'password' : 'text'}
                      aria-label={c}
                      placeholder={rreshti.sekret ? (rreshti.e_vendosur ? iRuajtur : 'e pavendosur') : ''}
                      value={cur}
                      onChange={e => setDraft(d => ({ ...d, [c]: e.target.value }))} />
                    {dirty && (
                      <button type="button" className="save-btn" disabled={busy === c}
                        onClick={() => ruaj(c, cur)}>
                        {busy === c ? '…' : 'Ruaj'}
                      </button>
                    )}
                    {ok === c && <span className="save-ok">✓</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      <div className="card">
        <div className="ct">Si funksionon</div>
        <div style={{ fontSize: 'var(--fs-dysheme)', color: '#666', lineHeight: 1.8 }}>
          Ekzistojnë dy tabela konfigurimi për arsye historike. Ky ekran i tregon si një të vetme
          dhe shkrimi kalon nga <code>admin_config_set()</code>, i cili zgjedh vetë depon e duhur.
          Kur i njëjti çelës ndodhet në të dyja, përditësohen të dyja — që të mos rilindë divergjenca.
          <br />
          Sekretet shfaqen të maskuara. Lëri bosh për t’i lënë siç janë; shkruaj vetëm kur do t’i ndryshosh.
          <br />
          Çdo ndryshim shkruhet te gjurma dhe vlen menjëherë.
        </div>
      </div>
    </>
  )
}
