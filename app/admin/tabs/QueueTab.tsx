'use client'

/**
 * RADHA — një radhë e vetme moderimi
 *
 * Zëvendëson dy skeda që ishin ndarë sipas TABELAVE (`reports` dhe
 * `takedown_requests`), jo sipas punës. Në bazë ato bashkohen tashmë në
 * `moderation_queue`; paneli ende i tregonte veç.
 *
 * RENDITJA — pse prioritet, jo datë:
 * Kur zërat e një radhe kanë kosto të ndryshme vonese, shërbimi sipas radhës
 * së mbërritjes maksimizon dëmin total. Renditja sipas afatit më të afërt
 * minimizon vonesën maksimale (Jackson, 1955). Prandaj: prioritet zbritës,
 * pastaj afat ngjitës — kritikja e sotme para ankesës së javës së kaluar.
 *
 * NDËRLIDHJET:
 *   admin_moderation_queue()   — radha me urgjencë, afat, shpallje, pronar
 *   admin_resolve_moderation() — vendimi mbyll raportet DHE njoftimet njëherësh
 *   admin_list_takedowns()     — njoftimet ligjore me afatin e vet
 *   admin_resolve_takedown()   — vendim me arsyetim të DETYRUESHËM
 */

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { DosjaLigjore } from './DosjaLigjore'

const URGJENCA: Record<string, [string, string]> = {
  kritike: ['Kritike', '#C42B0F'], larte: ['E lartë', '#BA7517'],
  mesme: ['Mesme', '#8A6D1F'], normale: ['Normale', '#666'], ulet: ['E ulët', '#999'],
}

function afati(due: string | null, vonuar: boolean): string {
  if (!due) return '—'
  const ms = new Date(due).getTime() - Date.now()
  const h = Math.abs(ms) / 3600000
  const teksti = h < 1 ? `${Math.round(Math.abs(ms) / 60000)} min`
    : h < 48 ? `${Math.round(h)} orë` : `${Math.round(h / 24)} ditë`
  return vonuar ? `vonuar ${teksti}` : `edhe ${teksti}`
}

const FILTRA: [string, string][] = [
  ['pending', 'Të hapura'], ['vonuar', 'Vonuar'], ['kritike', 'Kritike'],
  ['ligjore', 'Ligjore'], ['all', 'Të gjitha'],
]

export function QueueTab() {
  const [radha, setRadha] = useState<any[]>([])
  const [njoftime, setNjoftime] = useState<any[]>([])
  const [permbledhje, setPermbledhje] = useState<any>({})
  const [filtri, setFiltri] = useState('pending')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [hap, setHap] = useState('')
  const [arsyetimi, setArsyetimi] = useState('')
  const [dosja, setDosja] = useState('')
  const [ankime, setAnkime] = useState<any[]>([])
  const [verifikime, setVerifikime] = useState<any[]>([])

  const load = useCallback(async () => {
    const [q, t, a, v] = await Promise.all([
      supabase.rpc('admin_moderation_queue', { p_status: 'pending', p_limit: 200 }),
      supabase.rpc('admin_list_takedowns', { p_status: 'pending', p_limit: 100 }),
      supabase.rpc('admin_list_appeals', { p_status: 'pending', p_limit: 100 }),
      // Verifikimet rrine ne TE NJEJTIN ekran: te tria i pergjigjen te njejtes
      // pyetje te operatorit — "cfare pret vendimin tim?" (§6 e KUJTESES).
      supabase.rpc('admin_list_verifications', { p_status: 'pending', p_limit: 100 }),
    ])
    if (q.error || (q.data as any)?.error) { setErr(q.error?.message || (q.data as any)?.error); return }
    setRadha(((q.data as any)?.queue || []) as any[])
    setPermbledhje((q.data as any)?.permbledhje || {})
    if (!t.error && !(t.data as any)?.error) setNjoftime(((t.data as any)?.njoftime || []) as any[])
    if (!a.error && Array.isArray(a.data)) setAnkime(a.data as any[])
    if (!v.error && Array.isArray(v.data)) setVerifikime(v.data as any[])
    setErr('')
  }, [])

  useEffect(() => { load() }, [load])

  // Nje raport i ri duhet te shfaqet pa rifreskim — afatet nisin menjehere.
  useEffect(() => {
    const ch = supabase.channel('adm-radha')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'takedown_requests' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'moderation_queue' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const mesazh = (t: string) => { setOk(t); setTimeout(() => setOk(''), 4500) }

  async function vendos(id: string, veprimi: 'hiq' | 'mbaj', ligjore: boolean) {
    if (ligjore && arsyetimi.trim().length < 10) {
      setErr('Arsyetimi është i detyrueshëm për vendimet ligjore — mbetet përgjithmonë në gjurmë.')
      return
    }
    setBusy(id); setErr('')
    const { data, error } = await supabase.rpc('admin_resolve_moderation', {
      p_id: id, p_action: veprimi, p_note: arsyetimi.trim() || null,
    })
    setBusy('')
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    setHap(''); setArsyetimi('')
    mesazh(veprimi === 'hiq'
      ? 'Shpallja u hoq. Raportet dhe njoftimet u mbyllën njëherësh.'
      : 'Rasti u mbyll pa shkelje.')
    load()
  }

  // §2.4: ankimin nuk e shqyrton kush mori vendimin e pare. Baza e refuzon
  // gjithsesi (konflikt_interesi); ketu bllokohet edhe ne UI qe moderatori te
  // mos e provoje kot dhe ta kuptoje pse.
  async function vendosVerifikimin(id: string, prano: boolean) {
    if (arsyetimi.trim().length < 10) {
      setErr('Arsyetimi është i detyrueshëm — të paktën 10 karaktere.')
      return
    }
    setBusy(id); setErr('')
    const { data, error } = await supabase.rpc('admin_review_verification', {
      p_request_id: id, p_approve: prano, p_notes: arsyetimi.trim(),
    })
    setBusy('')
    if (error || (data as any)?.error) {
      setErr((data as any)?.error === 'forbidden'
        ? 'Nuk ke lejen `business.moderate`.'
        : (error?.message || (data as any)?.error))
      return
    }
    setHap(''); setArsyetimi(''); load()
  }

  async function vendosAnkimin(id: string, prano: boolean) {
    if (arsyetimi.trim().length < 10) {
      setErr('Arsyetimi është i detyrueshëm — përdoruesi merr përgjigje me shkrim.')
      return
    }
    setBusy(id); setErr('')
    const { data, error } = await supabase.rpc('admin_resolve_appeal', {
      p_id: id, p_accept: prano, p_note: arsyetimi.trim(),
    })
    setBusy('')
    if (error || (data as any)?.error) {
      setErr((data as any)?.mesazh || error?.message || (data as any)?.error); return
    }
    setHap(''); setArsyetimi('')
    mesazh(prano ? 'Ankimi u pranua — shpallja u rikthye.' : 'Ankimi u refuzua.')
    load()
  }

  async function vendosNjoftimin(id: string, prano: boolean) {
    if (arsyetimi.trim().length < 10) {
      setErr('Arsyetimi është i detyrueshëm — paraqitësi merr përgjigje me shkrim.')
      return
    }
    setBusy(id); setErr('')
    const { data, error } = await supabase.rpc('admin_resolve_takedown', {
      p_id: id, p_approve: prano, p_note: arsyetimi.trim(),
    })
    setBusy('')
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    const email = (data as any)?.njoftoje_paraqitesin
    setHap(''); setArsyetimi('')
    mesazh(prano
      ? `Njoftimi u pranua dhe shpallja u hoq.${email ? ` Përgjigju te ${email}.` : ''}`
      : `Njoftimi u refuzua.${email ? ` Përgjigju te ${email}.` : ''}`)
    load()
  }

  const shfaq = radha.filter(r => {
    if (filtri === 'vonuar') return r.vonuar
    if (filtri === 'kritike') return r.priority >= 4
    if (filtri === 'ligjore') return r.ligjore || (r.burime?.njoftime || 0) > 0
    return true
  })

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">🛡️</span> Radha</div>
        {ok ? <div className="live-dot">{ok}</div> : <div className="live-dot"><span aria-hidden="true">●</span> Drejtpërdrejt</div>}
      </div>

      <div className="stats">
        <div className="sc"><div className="sn">{permbledhje.ne_pritje ?? 0}</div><div className="sl">Të hapura</div></div>
        <div className="sc">
          <div className="sn" style={{ color: (permbledhje.vonuar ?? 0) > 0 ? '#C42B0F' : undefined }}>
            {permbledhje.vonuar ?? 0}</div>
          <div className="sl">Jashtë afatit</div>
        </div>
        <div className="sc">
          <div className="sn" style={{ color: (permbledhje.kritike ?? 0) > 0 ? '#BA7517' : undefined }}>
            {permbledhje.kritike ?? 0}</div>
          <div className="sl">Kritike</div>
        </div>
        <div className="sc"><div className="sn">{njoftime.length}</div><div className="sl">Njoftime ligjore</div></div>
      </div>

      {err && (
        <div className="card" role="alert"
          style={{ borderColor: '#F09595', background: '#FFF0EE', color: '#C42B0F', fontSize: 12 }}>{err}</div>
      )}

      <div className="card">
        <div className="ct">Radha e moderimit</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {FILTRA.map(([k, l]) => (
            <button type="button" key={k} className="btn" aria-pressed={filtri === k}
              style={{ background: filtri === k ? '#111' : '#f0f0f0', color: filtri === k ? '#fff' : '#555' }}
              onClick={() => setFiltri(k)}>{l}</button>
          ))}
        </div>

        {shfaq.length === 0 ? (
          <p style={{ color: '#1D9E75', fontSize: 12, fontWeight: 700, padding: '10px 0' }}>
            <span aria-hidden="true">✓</span> Asgjë nuk pret në këtë filtër.
          </p>
        ) : shfaq.map(r => {
          const [ue, uc] = URGJENCA[r.urgjenca] || ['—', '#666']
          const l = r.shpallja
          const ligjore = r.ligjore || (r.burime?.njoftime || 0) > 0
          return (
            <div key={r.id} style={{
              borderTop: '1px solid #f0f0f0', padding: '12px 0',
              background: r.vonuar ? '#FFF8F6' : undefined,
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {l?.foto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.foto} alt="" width={54} height={54}
                    style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 12.5, color: uc }}>{ue}</span>
                    <span style={{ fontSize: 10.5, color: r.vonuar ? '#C42B0F' : '#999', fontWeight: r.vonuar ? 700 : 400 }}>
                      {afati(r.due_at, r.vonuar)}
                    </span>
                    {ligjore && <span className="badge bd">ligjor</span>}
                    {l?.aktive === false && <span className="badge bd">hequr</span>}
                  </div>

                  <div style={{ fontWeight: 700, fontSize: 12.5, marginTop: 3 }}>
                    {l?.title || 'Shpallje e panjohur'}
                    {l?.cmimi != null && (
                      <span style={{ color: '#888', fontWeight: 400 }}>
                        {' · '}{Number(l.cmimi).toLocaleString('sq-AL')} L
                      </span>
                    )}
                    {l?.qyteti && <span style={{ color: '#aaa', fontWeight: 400 }}>{' · '}{l.qyteti}</span>}
                  </div>

                  {l?.pronari && (
                    <div style={{ fontSize: 10.5, color: '#999', marginTop: 2 }}>
                      Pronari: {l.pronari.emri || '—'}
                      {l.pronari.pezulluar && <span className="badge bd" style={{ marginLeft: 4 }}>pezulluar</span>}
                    </div>
                  )}

                  <div style={{ fontSize: 10.5, color: '#777', marginTop: 5 }}>
                    {(r.burime?.raporte || 0) > 0 && <>{r.burime.raporte} raporte</>}
                    {(r.burime?.raporte || 0) > 0 && (r.burime?.njoftime || 0) > 0 && ' · '}
                    {(r.burime?.njoftime || 0) > 0 && <>{r.burime.njoftime} njoftime ligjore</>}
                  </div>

                  {Array.isArray(r.arsyet) && r.arsyet.length > 0 && (
                    <div style={{ fontSize: 10.5, color: '#555', marginTop: 4 }}>
                      {r.arsyet.join(' · ')}
                    </div>
                  )}

                  {Array.isArray(r.detajet) && r.detajet.length > 0 && (
                    <ul style={{ margin: '5px 0 0 14px', padding: 0, fontSize: 11, color: '#666', lineHeight: 1.6 }}>
                      {r.detajet.map((d: string, i: number) => <li key={i}>„{d}"</li>)}
                    </ul>
                  )}

                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {l?.id && (
                      <a className="edit-btn" href={`/listing/${l.id}`} target="_blank" rel="noopener noreferrer">
                        Shiko shpalljen
                      </a>
                    )}
                    <button type="button" className="edit-btn"
                      onClick={() => { setHap(hap === r.id ? '' : r.id); setArsyetimi(''); setErr('') }}>
                      {hap === r.id ? 'Mbyll' : 'Vendos'}
                    </button>
                    {ligjore && (() => {
                      const nj = njoftime.find((n: any) => n.shpallja?.id === l?.id) || null
                      return nj ? (
                        <button type="button" className="edit-btn"
                          style={{ borderColor: '#C9A227', color: '#8A6D1F' }}
                          onClick={() => setDosja(nj.id)}>
                          Dosja ligjore
                        </button>
                      ) : null
                    })()}
                  </div>

                  {hap === r.id && (
                    <div style={{ marginTop: 8, borderTop: '2px solid #eee', paddingTop: 8 }}>
                      <input className="finput" value={arsyetimi}
                        aria-label="Arsyetimi i vendimit"
                        placeholder={ligjore
                          ? 'Arsyetimi (i detyrueshëm — paraqitësi merr përgjigje)'
                          : 'Shënim (opsional)'}
                        onChange={e => { setArsyetimi(e.target.value); setErr('') }} />
                      <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                        <button type="button" className="btn btn-red" disabled={busy === r.id}
                          onClick={() => vendos(r.id, 'hiq', ligjore)}>
                          {busy === r.id ? '…' : 'Hiq shpalljen'}
                        </button>
                        <button type="button" className="btn btn-green" disabled={busy === r.id}
                          onClick={() => vendos(r.id, 'mbaj', ligjore)}>
                          {busy === r.id ? '…' : 'Mbaj — pa shkelje'}
                        </button>
                      </div>
                      <div style={{ fontSize: 10, color: '#999', marginTop: 6 }}>
                        Vendimi mbyll njëherësh raportet dhe njoftimet për këtë shpallje.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Njoftimet ligjore që nuk janë lidhur me një shpallje konkrete */}
      {njoftime.filter(n => !n.shpallja).length > 0 && (
        <div className="card" style={{ borderColor: '#F0C36D', background: '#FFFDF6' }}>
          <div className="ct">Njoftime ligjore pa shpallje të lidhur</div>
          <div style={{ fontSize: 10.5, color: '#8A6D1F', marginBottom: 8 }}>
            URL-ja nuk u lidh dot me një shpallje. Verifikoje me dorë para se të vendosësh.
          </div>
          {njoftime.filter(n => !n.shpallja).map(n => (
            <div key={n.id} style={{ borderTop: '1px solid #f0e6c0', padding: '10px 0' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 12 }}>{n.lloji}</strong>
                <span style={{ fontSize: 10.5, color: n.vonuar ? '#C42B0F' : '#999' }}>
                  {afati(n.afati, n.vonuar)}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>„{n.pershkrimi}"</div>
              <div style={{ fontSize: 10.5, color: '#999', marginTop: 2 }}>
                {n.email} · <a href={n.url} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#185FA5' }}>{n.url}</a>
              </div>
              <div style={{ marginTop: 6 }}>
                <button type="button" className="edit-btn"
                  onClick={() => { setHap(hap === n.id ? '' : n.id); setArsyetimi(''); setErr('') }}>
                  {hap === n.id ? 'Mbyll' : 'Vendos'}
                </button>
                <button type="button" className="edit-btn"
                  style={{ borderColor: '#C9A227', color: '#8A6D1F', marginLeft: 6 }}
                  onClick={() => setDosja(n.id)}>Dosja ligjore</button>
              </div>
              {hap === n.id && (
                <div style={{ marginTop: 8 }}>
                  <input className="finput" value={arsyetimi} aria-label="Arsyetimi"
                    placeholder="Arsyetimi (i detyrueshëm)"
                    onChange={e => { setArsyetimi(e.target.value); setErr('') }} />
                  <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                    <button type="button" className="btn btn-red" disabled={busy === n.id}
                      onClick={() => vendosNjoftimin(n.id, true)}>Prano njoftimin</button>
                    <button type="button" className="btn btn-orange" disabled={busy === n.id}
                      onClick={() => vendosNjoftimin(n.id, false)}>Refuzo</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {verifikime.length > 0 && (
        <div className="card">
          <div className="ct"><span aria-hidden="true">✓</span> Verifikime ({verifikime.length})</div>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 8, lineHeight: 1.55 }}>
            Verifikimi krahason të dhënat e deklaruara me <strong>regjistrin publik të QKB-së</strong>.
            Vendimi shoqërohet gjithmonë me arsye — ajo i shkon kërkuesit si njoftim.
          </div>
          {verifikime.map(v => (
            <div key={v.id} style={{ borderTop: '1px solid #f0e6c0', padding: '10px 0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>
                {v.biznesi || v.kerkuesi}
              </div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
                Kërkuesi: {v.kerkuesi}
                {v.nipt ? <> · NIPT <strong>{v.nipt}</strong></> : <> · <em>pa NIPT të deklaruar</em></>}
                {' '}· bazë: {v.lloji}
              </div>
              <div style={{ fontSize: 10.5, color: '#555', marginTop: 3 }}>
                Dërguar më {v.derguar_me ? new Date(v.derguar_me).toLocaleDateString('sq-AL') : '—'}
                {v.ka_dokument ? ' · ka dokument të bashkëngjitur' : ''}
              </div>
              <div style={{ marginTop: 6 }}>
                <button type="button" className="edit-btn"
                  onClick={() => { setHap(hap === v.id ? '' : v.id); setArsyetimi(''); setErr('') }}>
                  {hap === v.id ? 'Mbyll' : 'Vendos'}
                </button>
                {hap === v.id && (
                  <div style={{ marginTop: 8 }}>
                    <input className="finput" value={arsyetimi} aria-label="Arsyetimi i verifikimit"
                      placeholder="Arsyetimi (i detyrueshëm) — p.sh. NIPT-i përputhet me QKB"
                      onChange={e => { setArsyetimi(e.target.value); setErr('') }} />
                    <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                      <button type="button" className="btn btn-green" disabled={busy === v.id}
                        onClick={() => vendosVerifikimin(v.id, true)}>Mirato</button>
                      <button type="button" className="btn btn-orange" disabled={busy === v.id}
                        onClick={() => vendosVerifikimin(v.id, false)}>Refuzo</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {ankime.length > 0 && (
        <div className="card">
          <div className="ct"><span aria-hidden="true">⚖️</span> Ankime ({ankime.length})</div>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 8, lineHeight: 1.55 }}>
            Përdoruesi ka kundërshtuar një vendim moderimi. Ankimin <strong>nuk e shqyrton
            kush mori vendimin e parë</strong> — kufi i zbatuar edhe në bazë.
          </div>
          {ankime.map(a => (
            <div key={a.id} style={{ borderTop: '1px solid #f0e6c0', padding: '10px 0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>
                {a.listing_titull || '(shpallje e fshirë)'}
              </div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
                <strong>Vendimi i parë:</strong> „{a.arsyetimi_fillestar || '—'}"
              </div>
              <div style={{ fontSize: 11, color: '#111', marginTop: 4 }}>
                <strong>Ankimi:</strong> „{a.arsyeja}"
              </div>
              {a.konflikt ? (
                <div role="note" style={{ marginTop: 8, background: '#FFF8E1', border: '1px solid #FFB74D', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#E65100', lineHeight: 1.5 }}>
                  Vendimin e parë e more ti. Këtë ankim duhet ta shqyrtojë një moderator tjetër.
                </div>
              ) : (
                <div style={{ marginTop: 6 }}>
                  <button type="button" className="edit-btn"
                    onClick={() => { setHap(hap === a.id ? '' : a.id); setArsyetimi(''); setErr('') }}>
                    {hap === a.id ? 'Mbyll' : 'Vendos'}
                  </button>
                  {hap === a.id && (
                    <div style={{ marginTop: 8 }}>
                      <input className="finput" value={arsyetimi} aria-label="Arsyetimi i ankimit"
                        placeholder="Arsyetimi (i detyrueshëm)"
                        onChange={e => { setArsyetimi(e.target.value); setErr('') }} />
                      <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                        <button type="button" className="btn btn-green" disabled={busy === a.id}
                          onClick={() => vendosAnkimin(a.id, true)}>Prano — riktheje</button>
                        <button type="button" className="btn btn-orange" disabled={busy === a.id}
                          onClick={() => vendosAnkimin(a.id, false)}>Refuzo</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {dosja && <DosjaLigjore id={dosja} onClose={() => { setDosja(''); load() }} />}

      <div className="card">
        <div className="ct">Si funksionon</div>
        <div style={{ fontSize: 11, color: '#666', lineHeight: 1.8 }}>
          Raportet e përdoruesve dhe njoftimet ligjore hyjnë në <strong>një radhë të vetme</strong>.
          Renditja nuk ndjek datën por <strong>afatin</strong>: kritikja e sotme del para ankesës së
          javës së kaluar, sepse kostoja e vonesës nuk është e njëjtë për të gjitha.
          <br />
          Afati llogaritet nga rëndësia: përmbajtje e paligjshme <strong>1 orë</strong>,
          rrezik për të miturit <strong>1 orë</strong>, mashtrim <strong>24 orë</strong>,
          pronësi intelektuale <strong>72 orë</strong>. Neni 17/1/b i ligjit 10128 kërkon
          veprim me marrjen dijeni — prandaj afati nis në çastin e raportimit, jo kur e sheh ti.
          <br />
          Nëse mbi një shpallje mbërrin një raport më i rëndë, afati <strong>shkurtohet
          vetvetiu</strong>. Vendimi mbyll njëherësh raportet, njoftimet dhe radhën.
        </div>
      </div>
    </>
  )
}
