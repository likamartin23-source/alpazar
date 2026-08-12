'use client'

/**
 * SOT — a është gjithçka në rregull, dhe çfarë pret mua
 *
 * Zëvendëson Dashboard-in, AI Health dhe Gjurmën.
 *
 * PSE: `admin_health()` ekzistonte me 30 tregues integriteti — premium pa
 * abonim, radhë jashtë afatit, shpallje të hequra por aktive, fatura pa
 * fiskalizuar, numërues të shkëputur — dhe NUK shfaqej askund. Sistemi e dinte
 * kur dy pjesë kishin filluar të ndaheshin dhe nuk ia thoshte askujt.
 *
 * Rregulli i këtij ekrani: çdo numër mbi zero është punë, dhe pranë tij thuhet
 * ku zgjidhet. Një tregues që nuk të çon askund është dekor.
 */

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

const d = (x: any) => (x ? new Date(x).toLocaleString('sq-AL') : '—')

/** Treguesit që kërkojnë veprim, me shtegun ku zgjidhen. */
const PUNA: [string, string, string, 'kritike' | 'paralajmerim'][] = [
  ['moderim_vonuar',            'Raste jashtë afatit ligjor',        'Radha',       'kritike'],
  ['radhe_jashte_afatit',       'Radhë jashtë afatit',               'Radha',       'kritike'],
  ['takedown_te_vjetra_72h',    'Njoftime ligjore mbi 72 orë',       'Radha',       'kritike'],
  ['moderim_ne_pritje',         'Raste në pritje',                   'Radha',       'paralajmerim'],
  ['njoftime_ne_pritje',        'Njoftime ligjore të hapura',        'Radha',       'paralajmerim'],
  ['raporte_ne_pritje',         'Raporte të hapura',                 'Radha',       'paralajmerim'],
  ['hequr_por_aktive',          'Hequr nga moderimi por ende aktive','Radha',       'kritike'],
  ['fatura_jashte_48_oreve',    'Fatura jashtë afatit 48-orësh',     'Paratë',      'kritike'],
  ['fatura_pa_derguar',         'Fatura pa dërguar te klienti',      'Paratë',      'paralajmerim'],
  ['fatura_pa_fiskalizuar',     'Pagesa pa faturë tatimore',         'Paratë',      'paralajmerim'],
  ['kerkesa_premium_ne_pritje', 'Kërkesa Premium në pritje',         'Paratë',      'paralajmerim'],
  ['premium_pa_abonim',         'Premium pa abonim përkatës',        'Njerëzit',    'kritike'],
  ['abonim_pa_premium',         'Abonim aktiv pa përfitim',          'Njerëzit',    'kritike'],
  ['premium_i_skaduar_ende_aktiv','Premium i skaduar ende aktiv',    'Njerëzit',    'kritike'],
  ['verifikime_ne_pritje',      'Verifikime biznesi në pritje',      'Njerëzit',    'paralajmerim'],
  ['mosmarreveshje_te_hapura',  'Mosmarrëveshje të hapura',          'Njerëzit',    'paralajmerim'],
  ['mesazhe_me_marres_te_paperputhur', 'Mesazhe me marrës të papërputhur', 'teknike', 'kritike'],
  ['radhe_jetime',              'Radhë pa burim',                    'teknike',     'paralajmerim'],
]

/** Konfigurime ligjore që mungojnë — bllokojnë detyrime, jo punë të përditshme. */
const MUNGESAT: [string, string][] = [
  ['nipt_mungon',     'NIPT-i i kompanisë mungon — fatura nuk e përmbush ligjin 87/2019'],
  ['adresa_mungon',   'Adresa e kompanisë mungon — e detyrueshme në faturë'],
  ['pin_i_paziguar',  'PIN-i i panelit është ende i parazgjedhur — ndryshoje sot'],
]

export function TodayTab({ stats, trends }: { stats?: any; trends?: any }) {
  const [sh, setSh] = useState<any>(null)
  const [gjurma, setGjurma] = useState<any[]>([])
  const [err, setErr] = useState('')
  const [kohe, setKohe] = useState<string>('')

  const load = useCallback(async () => {
    const [h, a] = await Promise.all([
      supabase.rpc('admin_health'),
      supabase.rpc('admin_recent_actions', { p_limit: 40 }),
    ])
    if (h.error || (h.data as any)?.error) { setErr(h.error?.message || (h.data as any)?.error) }
    else { setSh(h.data); setErr('') }
    if (!a.error && !(a.data as any)?.error) setGjurma(((a.data as any)?.actions || []) as any[])
    setKohe(new Date().toLocaleTimeString('sq-AL'))
  }, [])

  useEffect(() => { load() }, [load])

  // Shëndeti duhet të jetë i freskët — rifreskim çdo 60 sekonda.
  useEffect(() => {
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [load])

  const puna = sh ? PUNA.filter(([k]) => Number(sh[k] || 0) > 0) : []
  const kritike = puna.filter(([, , , n]) => n === 'kritike')
  const paralajmerime = puna.filter(([, , , n]) => n === 'paralajmerim')
  const mungesat = sh ? MUNGESAT.filter(([k]) => sh[k] === true) : []
  const numerues = sh?.numerues_te_shkeputur || {}
  const shkeputje = Object.entries(numerues).filter(([, v]) => Number(v) > 0)

  const gjithckaMire = sh && puna.length === 0 && shkeputje.length === 0

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">📋</span> Sot</div>
        <div className="live-dot">{kohe ? `rifreskuar ${kohe}` : 'duke ngarkuar…'}</div>
      </div>

      {err && (
        <div className="card" role="alert"
          style={{ borderColor: '#F09595', background: '#FFF0EE', color: '#C42B0F', fontSize: 12 }}>{err}</div>
      )}

      {gjithckaMire && (
        <div className="card" style={{ borderColor: '#97C459', background: '#F6FBEF' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#3B6D11' }}>
            <span aria-hidden="true">✓</span> Asgjë nuk pret veprim
          </div>
          <div style={{ fontSize: 11, color: '#5C7A3A', marginTop: 4 }}>
            Asnjë afat i tejkaluar, asnjë sistem i shkëputur.
          </div>
        </div>
      )}

      {kritike.length > 0 && (
        <div className="card" style={{ borderColor: '#F09595', background: '#FFF6F5' }}>
          <div className="ct" style={{ color: '#C42B0F' }}>Kërkon veprim tani</div>
          {kritike.map(([k, etiketa, ku]) => (
            <div key={k} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 0', borderTop: '1px solid #F7DEDA', fontSize: 12,
            }}>
              <strong style={{ color: '#C42B0F', minWidth: 34, fontSize: 15 }}>{sh[k]}</strong>
              <span style={{ flex: 1 }}>{etiketa}</span>
              <span style={{ fontSize: 10.5, color: '#999' }}>{ku}</span>
            </div>
          ))}
        </div>
      )}

      {paralajmerime.length > 0 && (
        <div className="card" style={{ borderColor: '#F0C36D', background: '#FFFDF6' }}>
          <div className="ct" style={{ color: '#8A6D1F' }}>Pret veprim</div>
          {paralajmerime.map(([k, etiketa, ku]) => (
            <div key={k} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 0', borderTop: '1px solid #F5E9C8', fontSize: 12,
            }}>
              <strong style={{ color: '#BA7517', minWidth: 34, fontSize: 15 }}>{sh[k]}</strong>
              <span style={{ flex: 1 }}>{etiketa}</span>
              <span style={{ fontSize: 10.5, color: '#999' }}>{ku}</span>
            </div>
          ))}
        </div>
      )}

      {mungesat.length > 0 && (
        <div className="card" style={{ borderColor: '#F0C36D' }}>
          <div className="ct">Konfigurim ligjor i paplotësuar</div>
          <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: 11.5, color: '#8A6D1F', lineHeight: 1.9 }}>
            {mungesat.map(([k, teksti]) => <li key={k}>{teksti}</li>)}
          </ul>
          <div style={{ fontSize: 10.5, color: '#999', marginTop: 6 }}>Zgjidhen te Konfigurime.</div>
        </div>
      )}

      {shkeputje.length > 0 && (
        <div className="card" style={{ borderColor: '#F09595' }}>
          <div className="ct" style={{ color: '#C42B0F' }}>Numërues të shkëputur nga e vërteta</div>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>
            Këta numra u shfaqen përdoruesve. Kur ndryshojnë nga numërimi real,
            do të thotë se dy pjesë kanë filluar të ndahen.
          </div>
          {shkeputje.map(([k, v]) => (
            <div key={k} style={{ fontSize: 11.5, padding: '3px 0' }}>
              <strong style={{ color: '#C42B0F' }}>{String(v)}</strong> te <code>{k}</code>
            </div>
          ))}
        </div>
      )}

      {/* ── Numrat e biznesit ─────────────────────────────────────── */}
      {stats && (
        <div className="stats">
          <div className="sc"><div className="sn">{Number(stats.users || 0).toLocaleString('sq-AL')}</div><div className="sl">Përdorues</div></div>
          <div className="sc"><div className="sn">{stats.premium ?? 0}</div><div className="sl">Me plan aktiv</div></div>
          <div className="sc"><div className="sn">{Number(stats.listings || 0).toLocaleString('sq-AL')}</div><div className="sl">Shpallje aktive</div></div>
          <div className="sc"><div className="sn">{Number(stats.messages || 0).toLocaleString('sq-AL')}</div><div className="sl">Mesazhe</div></div>
        </div>
      )}

      {trends?.totale && (
        <div className="card">
          <div className="ct">Periudha</div>
          <div style={{ fontSize: 11.5, color: '#555', lineHeight: 1.9 }}>
            Rimbursuar: <strong style={{ color: Number(trends.totale.rimbursime) > 0 ? '#E63312' : '#111' }}>
              {Number(trends.totale.rimbursime || 0).toLocaleString('sq-AL')}</strong>
          </div>
        </div>
      )}

      {/* ── Gjurma ────────────────────────────────────────────────── */}
      <div className="card">
        <div className="ct">Veprimet e fundit të administratës</div>
        {gjurma.length === 0 ? (
          <p style={{ fontSize: 11.5, color: '#aaa', padding: '8px 0' }}>Asnjë veprim i regjistruar.</p>
        ) : (
          <table>
            <thead><tr><th>Veprimi</th><th>Objekti</th><th>Kush</th><th>Kur</th></tr></thead>
            <tbody>
              {gjurma.slice(0, 25).map((a: any, i: number) => (
                <tr key={a.id || i}>
                  <td style={{ fontSize: 11, fontWeight: 600 }}>{a.action}</td>
                  <td style={{ fontSize: 10.5, color: '#888' }}>{a.target_type || '—'}</td>
                  <td style={{ fontSize: 10.5 }}>{a.admin_name || a.admin_id?.slice(0, 8) || '—'}</td>
                  <td style={{ fontSize: 10, color: '#aaa' }}>{d(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ fontSize: 10.5, color: '#999', marginTop: 8, lineHeight: 1.7 }}>
          Çdo veprim i administratës shkruhet këtu me arsyen. Kjo është prova se platforma
          vepron në mënyrë të kujdesshme dhe jo arbitrare — kërkesë e nenit 28 të ligjit 124/2024.
        </div>
      </div>
    </>
  )
}
