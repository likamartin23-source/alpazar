'use client'

/**
 * NJERËZIT — personi si njësi
 *
 * Përpara ishin dy skeda: Përdoruesit dhe Bizneset. Por biznesi është pronë e
 * një personi (`businesses.owner_id`). Për të vendosur për një njeri duhej
 * kaluar nëpër të dyja dhe mbajtur mend gjendja — pra vendimi merrej me
 * informacion të pjesshëm.
 *
 * Tani: një listë njerëzish, dhe brenda secilit dosja e plotë nga
 * `admin_person()` — abonimi, faturat, bizneset, shpalljet, moderimi,
 * verifikimet dhe privatësia në një pamje.
 *
 * VEPRIMET kryhen përmes RPC-ve me leje dhe gjurmë, jo përmes rrugës me PIN.
 */

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

const d = (x: any) => (x ? new Date(x).toLocaleDateString('sq-AL') : '—')
const L = (n: any) => Number(n || 0).toLocaleString('sq-AL', { maximumFractionDigits: 2 })

const FILTRA: [string, string][] = [
  ['all', 'Të gjithë'], ['raportuar', 'Të raportuar'], ['pret', 'Presin verifikim'],
  ['biznese', 'Me biznes'], ['premium', 'Premium'], ['boost', 'Boost'],
  ['suspended', 'Të pezulluar'], ['admins', 'Administrata'],
]

const NIVELI: Record<number, [string, string]> = {
  2: ['Boost', '#7A3FA6'], 1: ['Premium', '#BA7517'], 0: ['Falas', '#999'],
}

export function PeopleTab() {
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [filtri, setFiltri] = useState('all')
  const [hap, setHap] = useState('')
  const [dosja, setDosja] = useState<any>(null)
  const [duke, setDuke] = useState(false)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [arsyeja, setArsyeja] = useState('')
  const [konfirmoFshirjen, setKonfirmoFshirjen] = useState('')
  const [konfirmoBiz, setKonfirmoBiz] = useState('')
  const [plane, setPlane] = useState<any[]>([])
  const [plani, setPlani] = useState<Record<string, string>>({})

  const load = useCallback(async (search = q, f = filtri) => {
    const { data, error } = await supabase.rpc('admin_list_users',
      { p_q: search || '', p_filter: f, p_limit: 200 })
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    setRows((data as any)?.users || []); setErr('')
  }, [q, filtri])

  useEffect(() => { load('', filtri) }, [filtri]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase.from('premium_plans').select('id,name,tier').eq('is_active', true)
      .then(({ data }) => setPlane(data || []))
  }, [])

  // Gjendja e nje personi mund te ndryshoje nga nje pagese ose nje raport i ri.
  useEffect(() => {
    const ch = supabase.channel('adm-njerez')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const mesazh = (t: string) => { setOk(t); setTimeout(() => setOk(''), 4500) }

  async function hapDosjen(id: string) {
    if (hap === id) { setHap(''); setDosja(null); return }
    setHap(id); setDosja(null); setDuke(true); setErr(''); setArsyeja(''); setKonfirmoFshirjen(''); setKonfirmoBiz('')
    const { data, error } = await supabase.rpc('admin_person', { p_user_id: id })
    setDuke(false)
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    setDosja(data)
  }

  async function thirr(fn: string, args: any, id: string, mesazhiOk: string) {
    setBusy(id); setErr('')
    const { data, error } = await supabase.rpc(fn, args)
    setBusy('')
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return false }
    mesazh(mesazhiOk)
    await load()
    if (hap) {
      const { data: dd } = await supabase.rpc('admin_person', { p_user_id: hap })
      if (dd && !(dd as any).error) setDosja(dd)
    }
    return true
  }

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">👥</span> Njerëzit</div>
        {ok ? <div className="live-dot">{ok}</div> : <div className="live-dot"><span aria-hidden="true">●</span> Live</div>}
      </div>

      <div className="stats">
        <div className="sc"><div className="sn">{rows.length}</div><div className="sl">Në listë</div></div>
        <div className="sc">
          <div className="sn" style={{ color: rows.some(r => r.raporte_te_hapura > 0) ? '#C42B0F' : undefined }}>
            {rows.filter(r => r.raporte_te_hapura > 0).length}</div>
          <div className="sl">Të raportuar</div>
        </div>
        <div className="sc">
          <div className="sn" style={{ color: rows.some(r => r.pret_verifikim > 0) ? '#BA7517' : undefined }}>
            {rows.filter(r => r.pret_verifikim > 0).length}</div>
          <div className="sl">Presin verifikim</div>
        </div>
        <div className="sc"><div className="sn">{rows.filter(r => r.niveli > 0).length}</div><div className="sl">Me plan</div></div>
      </div>

      {err && (
        <div className="card" role="alert"
          style={{ borderColor: '#F09595', background: '#FFF0EE', color: '#C42B0F', fontSize: 12 }}>{err}</div>
      )}

      <div className="card">
        <div className="ct">
          Kërko
          <input className="finput" style={{ width: 280 }} value={q}
            placeholder="Emër, telefon, email, biznes ose NIPT…" aria-label="Kërko person"
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') load(q, filtri) }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTRA.map(([k, l]) => (
            <button type="button" key={k} className="btn" aria-pressed={filtri === k}
              style={{ background: filtri === k ? '#111' : '#f0f0f0', color: filtri === k ? '#fff' : '#555' }}
              onClick={() => setFiltri(k)}>{l}</button>
          ))}
          <button type="button" className="btn btn-orange" onClick={() => load(q, filtri)}>Kërko</button>
        </div>
      </div>

      <div className="card">
        <div className="ct">Personat</div>
        {rows.length === 0 ? (
          <p style={{ color: '#aaa', fontSize: 12, padding: '12px 0' }}>Asnjë person në këtë filtër.</p>
        ) : rows.map(u => {
          const [nl, nc] = NIVELI[u.niveli] || NIVELI[0]
          const hapur = hap === u.id
          return (
            <div key={u.id} style={{ borderTop: '1px solid #f0f0f0', padding: '10px 0' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <strong style={{ fontSize: 12.5 }}>{u.full_name || u.username || '—'}</strong>
                  {u.is_admin && <span className="badge ba" style={{ marginLeft: 5 }}>admin</span>}
                  {u.is_suspended && <span className="badge bd" style={{ marginLeft: 5 }}>pezulluar</span>}
                  {u.is_verified && <span className="badge ba" style={{ marginLeft: 5 }}>verifikuar</span>}
                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
                    {u.phone || u.email || '—'} · anëtar {d(u.created_at)}
                  </div>
                </div>

                <span style={{ fontSize: 11, fontWeight: 700, color: nc }}>{nl}</span>

                <div style={{ fontSize: 10.5, color: '#777', minWidth: 150 }}>
                  {u.listings} shpallje
                  {u.biznese > 0 && <> · {u.biznese} biznes{u.biznese > 1 ? 'e' : ''}</>}
                  {u.raporte_te_hapura > 0 && (
                    <span style={{ color: '#C42B0F', fontWeight: 700 }}> · {u.raporte_te_hapura} raporte</span>
                  )}
                  {u.pret_verifikim > 0 && (
                    <span style={{ color: '#BA7517', fontWeight: 700 }}> · pret verifikim</span>
                  )}
                </div>

                <button type="button" className="edit-btn" onClick={() => hapDosjen(u.id)}>
                  {hapur ? 'Mbyll' : 'Dosja'}
                </button>
              </div>

              {hapur && (
                <div style={{ marginTop: 10, borderTop: '2px solid #eee', paddingTop: 10 }}>
                  {duke && <div style={{ fontSize: 11, color: '#aaa' }}>Duke hapur dosjen…</div>}

                  {dosja && (
                    <>
                      {/* ── Gjendja financiare dhe operative ─────────────── */}
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: '#555' }}>
                        <div>
                          <div style={{ color: '#999', fontSize: 10 }}>Abonimi</div>
                          {dosja.abonimi
                            ? <>{dosja.abonimi.tier} · deri {d(dosja.abonimi.deri)}
                                {dosja.abonimi.anulohet_ne_fund && <span className="badge bd" style={{ marginLeft: 4 }}>anulohet</span>}</>
                            : 'pa abonim'}
                        </div>
                        <div>
                          <div style={{ color: '#999', fontSize: 10 }}>Paguar</div>
                          {L(dosja.faturimi?.paguar)} L
                          {Number(dosja.faturimi?.rimbursuar) > 0 &&
                            <span style={{ color: '#C42B0F' }}> · −{L(dosja.faturimi.rimbursuar)}</span>}
                        </div>
                        <div>
                          <div style={{ color: '#999', fontSize: 10 }}>Shpallje</div>
                          {dosja.shpalljet?.aktive}/{dosja.shpalljet?.gjithsej} aktive
                          {dosja.shpalljet?.hequr > 0 &&
                            <span style={{ color: '#C42B0F' }}> · {dosja.shpalljet.hequr} hequr</span>}
                        </div>
                        <div>
                          <div style={{ color: '#999', fontSize: 10 }}>Moderimi</div>
                          {dosja.moderimi?.raporte_kunder} raporte
                          {dosja.moderimi?.ne_radhe > 0 &&
                            <span style={{ color: '#C42B0F', fontWeight: 700 }}> · {dosja.moderimi.ne_radhe} në radhë</span>}
                        </div>
                        <div>
                          <div style={{ color: '#999', fontSize: 10 }}>GDPR</div>
                          {dosja.privatesia?.pelqim_gdpr ? 'pëlqim ✓' : 'pa pëlqim'}
                          {dosja.privatesia?.marketing && ' · marketing ✓'}
                        </div>
                      </div>

                      {dosja.faturimi?.pa_fature_tatimore > 0 && (
                        <div style={{ marginTop: 8, fontSize: 11, color: '#BA7517', fontWeight: 600 }}>
                          {dosja.faturimi.pa_fature_tatimore} pagesa presin faturën tatimore — shko te Paratë.
                        </div>
                      )}

                      {/* ── Bizneset e tij ───────────────────────────────── */}
                      {dosja.bizneset?.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 10.5, color: '#999', marginBottom: 5 }}>Bizneset</div>
                          {dosja.bizneset.map((b: any) => (
                            <div key={b.id} style={{
                              display: 'flex', gap: 8, alignItems: 'center',
                              flexWrap: 'wrap', padding: '5px 0', fontSize: 11.5,
                            }}>
                              <strong style={{ flex: 1, minWidth: 120 }}>{b.emri}</strong>
                              {b.i_verifikuar
                                ? <span className="badge ba">verifikuar</span>
                                : <span className="badge bp">pa verifikuar</span>}
                              {!b.i_dukshem && <span className="badge bd">i errësuar</span>}
                              <span style={{ fontSize: 10, color: '#aaa' }}>{b.shpallje} shpallje</span>
                              <button type="button" className="edit-btn" disabled={busy === b.id}
                                onClick={() => thirr('admin_set_business_flag',
                                  { p_business_id: b.id, p_flag: 'is_verified', p_value: !b.i_verifikuar,
                                    p_reason: arsyeja || null }, b.id,
                                  b.i_verifikuar ? 'Verifikimi u hoq.' : 'Biznesi u verifikua.')}>
                                {b.i_verifikuar ? 'Hiq verifikimin' : 'Verifiko'}
                              </button>
                              <button type="button" className="edit-btn" disabled={busy === b.id}
                                onClick={() => thirr('admin_set_business_flag',
                                  { p_business_id: b.id, p_flag: 'is_visible', p_value: !b.i_dukshem,
                                    p_reason: arsyeja || null }, b.id,
                                  b.i_dukshem ? 'Biznesi u errësua.' : 'Biznesi u çerrësua.')}>
                                {b.i_dukshem ? 'Errëso' : 'Çerrëso'}
                              </button>
                              {konfirmoBiz === b.id ? (
                                <>
                                  <button type="button" className="edit-btn" disabled={busy === b.id}
                                    style={{ color: '#fff', background: '#C42B0F', borderColor: '#C42B0F' }}
                                    onClick={async () => {
                                      const ok = await thirr('admin_delete_business',
                                        { p_business_id: b.id, p_reason: arsyeja || null }, b.id, 'Biznesi u fshi.')
                                      if (ok) setKonfirmoBiz('')
                                    }}>Po, fshije</button>
                                  <button type="button" className="edit-btn" disabled={busy === b.id}
                                    onClick={() => setKonfirmoBiz('')}>Anulo</button>
                                </>
                              ) : (
                                <button type="button" className="edit-btn" disabled={busy === b.id}
                                  style={{ color: '#C42B0F' }}
                                  onClick={() => setKonfirmoBiz(b.id)}>Fshi biznesin</button>
                              )}
                            </div>
                          ))}
                          {dosja.bizneset.some((b: any) => !b.i_dukshem) && (
                            <div style={{ fontSize: 10, color: '#999', marginTop: 3 }}>
                              Errësimi ndodh vetvetiu kur Premium-i nuk është aktiv.
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Veprimet ─────────────────────────────────────── */}
                      <div style={{ marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                        <input className="finput" value={arsyeja}
                          aria-label="Arsyeja e veprimit"
                          placeholder="Arsyeja — shkruhet në gjurmë dhe i thuhet personit"
                          onChange={e => { setArsyeja(e.target.value); setErr('') }} />

                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                          <button type="button"
                            className={u.is_suspended ? 'btn btn-green' : 'btn btn-red'}
                            disabled={busy === u.id}
                            onClick={() => {
                              if (!u.is_suspended && !arsyeja.trim()) {
                                setErr('Arsyeja është e detyrueshme për pezullim.'); return
                              }
                              thirr('admin_set_user_flag',
                                { p_user_id: u.id, p_flag: 'is_suspended',
                                  p_value: !u.is_suspended, p_reason: arsyeja.trim() || null },
                                u.id, u.is_suspended ? 'Pezullimi u hoq.' : 'Personi u pezullua dhe u njoftua.')
                            }}>
                            {u.is_suspended ? 'Hiq pezullimin' : 'Pezullo'}
                          </button>

                          <button type="button" className="edit-btn" disabled={busy === u.id}
                            onClick={() => thirr('admin_set_user_flag',
                              { p_user_id: u.id, p_flag: 'is_verified', p_value: !u.is_verified, p_reason: null },
                              u.id, u.is_verified ? 'Verifikimi u hoq.' : 'Personi u verifikua.')}>
                            {u.is_verified ? 'Hiq verifikimin' : 'Verifiko'}
                          </button>

                          {plane.length > 0 && (
                            <>
                              <select className="finput" style={{ width: 150 }}
                                aria-label="Plani për dhuratë"
                                value={plani[u.id] || ''}
                                onChange={e => setPlani(p => ({ ...p, [u.id]: e.target.value }))}>
                                <option value="">Zgjidh planin…</option>
                                {plane.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              <button type="button" className="btn btn-orange"
                                disabled={busy === u.id || !plani[u.id]}
                                onClick={() => thirr('admin_gift_subscription',
                                  { p_user_id: u.id, p_plan_id: plani[u.id], p_days: null },
                                  u.id, 'Plani u dhurua — pa faturë, sepse nuk ka pagesë.')}>
                                Dhuro
                              </button>
                            </>
                          )}

                          {dosja.abonimi && (
                            <button type="button" className="edit-btn" style={{ color: '#C42B0F' }}
                              disabled={busy === u.id}
                              onClick={() => thirr('admin_deactivate_subscription',
                                { p_user_id: u.id, p_reason: arsyeja.trim() || 'Nga paneli', p_tier: 'premium' },
                                u.id, 'Abonimi u ndërpre.')}>
                              Ndërprit abonimin
                            </button>
                          )}

                          {konfirmoFshirjen === u.id ? (
                            <>
                              <button type="button" className="btn btn-red" disabled={busy === u.id}
                                onClick={() => thirr('admin_delete_user', { p_user_id: u.id }, u.id,
                                  'Llogaria u fshi.')}>
                                Po, fshi përgjithmonë
                              </button>
                              <button type="button" className="edit-btn"
                                onClick={() => setKonfirmoFshirjen('')}>Anulo</button>
                            </>
                          ) : (
                            <button type="button" className="edit-btn" style={{ color: '#C42B0F' }}
                              onClick={() => setKonfirmoFshirjen(u.id)}>Fshi llogarinë</button>
                          )}
                        </div>

                        <div style={{ fontSize: 10, color: '#999', marginTop: 8, lineHeight: 1.6 }}>
                          Fshirja e llogarisë nuk i heq faturat — ato ruhen sipas ligjit 87/2019.
                          Çdo veprim shkruhet në gjurmë me arsyen.
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
