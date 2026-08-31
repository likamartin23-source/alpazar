'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAlpazar } from '../../lib/context'
import { BILLING_CSS, EVENT_LABELS, StatusBadge } from './ui'
import { PlansGrid, MyInvoices, BoostStrip } from './parts'
import { moneyDec } from '../../lib/format'

export default function BillingPage() {
  const { user, authReady } = useAlpazar()
  const [data, setData] = useState<any>(null)
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [heqja, setHeqja] = useState<any>(null)
  const [konfirmoHeqjen, setKonfirmoHeqjen] = useState(false)
  const [arsyeHeqjeje, setArsyeHeqjeje] = useState('')

  const load = useCallback(async () => {
    // Dy leximet bashke: faturimi dhe gjendja e te drejtes 14-ditore. E dyta
    // ekzistonte e plote ne baze (my_withdrawal_right / withdraw_from_subscription /
    // _issue_credit_note) por ASNJE rresht i nderfaqes nuk e prekte — pra nje e
    // drejte ligjore e ndertuar dhe e paarritshme. Gjetur me 31 gusht 2026.
    const [{ data: d, error }, { data: w }] = await Promise.all([
      supabase.rpc('get_my_billing'),
      supabase.rpc('my_withdrawal_right'),
    ])
    if (!error) setData(d)
    setHeqja((w as any) ?? null)
  }, [])

  useEffect(() => {
    if (!authReady) return
    if (!user) { window.location.href = '/auth/login'; return }
    load()
    const ch = supabase.channel('billing-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [authReady, user, load])

  async function act(fn: string, args?: any) {
    setBusy(fn); setMsg('')
    const { data: r, error } = await supabase.rpc(fn, args)
    setBusy('')
    if (error || r?.error) { setMsg(`err:${error?.message || r?.error}`); return }
    setMsg('ok:Veprimi u krye me sukses.')
    setConfirmCancel(false)
    load()
  }

  const sub = data?.subscription
  const plan = sub?.plan
  const plans: any[] = data?.plans || []
  const events: any[] = data?.events || []
  const bank = sub?.payment_method?.config_json || null
  const [mt, mm] = msg.split(/:(.+)/)

  const totalDays = plan?.duration_days || 30
  const daysLeft = sub?.days_left ?? null
  /* `get_my_billing` e mbron `days_left` nga null-i, por daten jo: nje periudhe
     pa `current_period_end` e shfaqte si 'Invalid Date' te faqja e faturimit —
     pikerisht atje ku klienti qe paguan pret qartesi. Nje funksion i vetem
     mban te njejten sjellje ne te tria vendet ku shfaqet ajo date. */
  const dataOse = (v: any, ndryshe = 'pa datë të caktuar') => {
    const d = v ? new Date(v) : null
    return d && !isNaN(d.getTime()) ? d.toLocaleDateString('sq-AL') : ndryshe
  }
  const pct = daysLeft != null ? Math.max(0, Math.min(100, Math.round((daysLeft / totalDays) * 100))) : 0

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BILLING_CSS }} />
      <div className="wrap">
        <div className="topbar">
          <button type="button" className="back" aria-label="Kthehu" onClick={() => window.history.back()}><i className="ti ti-arrow-left" aria-hidden="true" /></button>
          <h1 className="tt">Plani im</h1>
        </div>
        <div className="body">
          {msg && <div className={`msg ${mt}`} role="alert">{mm}</div>}

          {!data && <div className="card center muted">Duke ngarkuar…</div>}

          {data && sub && (
            <div className="card">
              <div className="row">
                <div>
                  <div className="plan-name">{plan?.name}</div>
                  <div className="muted">
                    {moneyDec(plan?.price_all)} L / {plan?.months || 1} muaj
                  </div>
                </div>
                <StatusBadge status={sub.status} cape={sub.cancel_at_period_end} />
              </div>

              {sub.status === 'active' && (
                <>
                  <div className="muted" style={{ marginTop: 10 }}>
                    {sub.cancel_at_period_end
                      ? <>Aktiv deri më <b>{dataOse(sub.current_period_end)}</b> — nuk rinovohet.</>
                      : <>Periudha mbaron më <b>{dataOse(sub.current_period_end)}</b>{daysLeft != null ? <> ({daysLeft} ditë të mbetura)</> : null}.</>}
                  </div>
                  <div className="bar"><div className="fill" style={{ width: `${pct}%` }} /></div>
                  {/* Rinovim automatik: 'nuk anulohet' = aktiv. Cron-i (auto_renew_run) e nis
                      rinovimin para skadimit; me grace 24h aksesi s'ndërpritet menjëherë. */}
                  <div className="note">
                    {sub.cancel_at_period_end
                      ? <>⏹ <b>Rinovim automatik: joaktiv</b> — aksesi mbaron në fund të periudhës.</>
                      : <>🔄 <b>Rinovim automatik: aktiv</b> — nisim rinovimin para skadimit (24h afat mëshire).</>}
                  </div>
                  {sub.pending_plan && (
                    <div className="note">Në rinovim kalon te plani <b>{sub.pending_plan.name}</b>.</div>
                  )}
                  <div className="btns">
                    {/* Rinovim manual PARA skadimit — hap kërkesë rinovimi për planin aktual. */}
                    <button type="button" className="btn primary" disabled={!!busy} onClick={() => act('renew_my_subscription')}>Rinovo tani</button>
                    {sub.cancel_at_period_end
                      ? <button type="button" className="btn" disabled={!!busy} onClick={() => act('resume_my_subscription')}>Rikthe rinovimin automatik</button>
                      : confirmCancel
                        ? <>
                            <button type="button" className="btn danger" disabled={!!busy} onClick={() => act('cancel_my_subscription')}>Po, çaktivizo</button>
                            <button type="button" className="btn" onClick={() => setConfirmCancel(false)}>Jo</button>
                          </>
                        : <button type="button" className="btn" disabled={!!busy} onClick={() => setConfirmCancel(true)}>Çaktivizo rinovimin</button>}
                  </div>
                  {confirmCancel && <div className="note warn">Mban aksesin deri më {dataOse(sub.current_period_end)}. Asnjë pagesë tjetër nuk kërkohet.</div>}

                  {/* ── E DREJTA 14-DITORE E HEQJES DORE (neni 37, ligji 9902/2008) ──
                      Kjo NUK eshte anulim. Anulimi ndal rinovimin dhe aksesi vazhdon
                      deri ne fund te periudhes se paguar; heqja dore e nderpret
                      kontraten dhe kthen parate. Te dyja duhen te dukshme dhe te
                      ndara, perndryshe perdoruesi zgjedh te gabuaren. */}
                  {heqja?.ka_abonim && (
                    heqja.brenda_afatit ? (
                      <div className="note" style={{ marginTop: 12 }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                          ⏱ Heqje dorë brenda 14 ditëve — pa arsye, pa penalitet
                        </div>
                        <div>
                          Afati skadon më <b>{dataOse(heqja.afati_skadon)}</b>
                          {heqja.dite_te_mbetura != null ? <> ({heqja.dite_te_mbetura} ditë të mbetura)</> : null}.
                          {' '}Kthehen <b>{moneyDec(heqja.rimbursim_i_pritshem)} {heqja.monedha || 'ALL'}</b>
                          {heqja.perpjesetim_i_zbatuar
                            ? <> — pjesa në raport me ditët e shfrytëzuara mbahet, sipas pëlqimit që ke dhënë për nisje të menjëhershme.</>
                            : <> — e plotë.</>}
                        </div>
                        <div style={{ fontSize: 11, marginTop: 6 }}>{heqja.shenim_rimbursimi}</div>
                        {!konfirmoHeqjen ? (
                          <div className="btns" style={{ marginTop: 10 }}>
                            <button type="button" className="btn" disabled={!!busy}
                              onClick={() => setKonfirmoHeqjen(true)}>Hiq dorë dhe kthe pagesën</button>
                          </div>
                        ) : (
                          <div style={{ marginTop: 10 }}>
                            <label htmlFor="arsye-heqjeje" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                              Arsyeja (jo e detyrueshme — ligji nuk të kërkon të japësh arsye)
                            </label>
                            <input id="arsye-heqjeje" type="text" value={arsyeHeqjeje}
                              onChange={e => setArsyeHeqjeje(e.target.value)}
                              placeholder="Nuk kërkohet arsye"
                              style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                            <div className="btns" style={{ marginTop: 8 }}>
                              <button type="button" className="btn danger" disabled={!!busy}
                                onClick={() => act('withdraw_from_subscription', { p_reason: arsyeHeqjeje.trim() || null })}>
                                Po, hiq dorë
                              </button>
                              <button type="button" className="btn" onClick={() => setKonfirmoHeqjen(false)}>Jo</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="note" style={{ marginTop: 12, fontSize: 11.5 }}>
                        Afati 14-ditor i heqjes dorë ka kaluar më {dataOse(heqja.afati_skadon)}.
                        Mund ta çaktivizosh rinovimin që abonimi të mos vazhdojë më tej.
                      </div>
                    )
                  )}
                </>
              )}

              {sub.status === 'pending' && (
                <>
                  <div className="note">Kërkesa jote është <b>në pritje të konfirmimit</b>. Pasi të kryhet pagesa dhe të verifikohet, plani aktivizohet automatikisht.</div>
                  {bank && (
                    <div className="bank">
                      <div className="bank-t">Të dhënat e pagesës — {sub.payment_method?.name}</div>
                      {bank.bank_name && <div><span>Banka:</span> {bank.bank_name}</div>}
                      {bank.account_holder && <div><span>Përfituesi:</span> {bank.account_holder}</div>}
                      {bank.iban && <div><span>IBAN:</span> <code>{bank.iban}</code></div>}
                      {bank.swift && <div><span>SWIFT:</span> {bank.swift}</div>}
                      {bank.paypal_email && <div><span>PayPal:</span> <code>{bank.paypal_email}</code></div>}
                      {bank.paypal_link && <div><span>Link:</span> <a href={bank.paypal_link} target="_blank" rel="noopener noreferrer">{bank.paypal_link}</a></div>}
                      {bank.instructions && <div className="muted" style={{ marginTop: 6 }}>{bank.instructions}</div>}
                    </div>
                  )}
                  <div className="btns">
                    <button type="button" className="btn" disabled={!!busy} onClick={() => act('cancel_my_subscription')}>Anulo kërkesën</button>
                  </div>
                </>
              )}
            </div>
          )}

          <BoostStrip boost={data?.boost} />

          {data && <PlansGrid plans={plans} plan={plan} sub={sub} busy={busy} act={act} />}

          <MyInvoices />

          {data && events.length > 0 && (
            <div className="card">
              <div className="sec-t">Historia</div>
              {events.map((e: any) => (
                <div key={e.id} className="ev">
                  <span>{EVENT_LABELS[e.type] || e.type}</span>
                  <span className="muted">{new Date(e.created_at).toLocaleDateString('sq-AL')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
