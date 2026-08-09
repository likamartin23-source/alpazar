'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

const SEGMENTS = [
  ['all', 'Të gjithë'], ['premium', 'Premium'], ['boost', 'VIP Boost'],
  ['free', 'Pa pagesë'], ['verified', 'Të verifikuar'], ['suspended', 'Të pezulluar'],
] as const

export function BroadcastTab() {
  const [counts, setCounts] = useState<any>({})
  const [seg, setSeg] = useState<string>('all')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [confirm, setConfirm] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('admin_segment_counts')
    if (data && !(data as any).error) setCounts(data)
  }, [])
  useEffect(() => { load() }, [load])

  const target = Number(counts?.[seg] ?? 0)

  async function send() {
    setBusy(true); setErr(''); setMsg('')
    const { data, error } = await supabase.rpc('admin_broadcast', {
      p_title: title.trim(), p_body: body.trim(), p_segment: seg, p_link: link.trim() || null,
    })
    setBusy(false); setConfirm(false)
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    setMsg(`U dërgua te ${(data as any).derguar} përdorues.`)
    setTitle(''); setBody(''); setLink('')
    setTimeout(() => setMsg(''), 5000)
  }

  const gati = title.trim().length > 2 && body.trim().length > 2 && target > 0

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">📣</span> Njoftime</div>
        {msg && <div className="live-dot">{msg}</div>}
      </div>

      <div className="stats">
        {SEGMENTS.slice(0, 4).map(([k, l]) => (
          <div className="sc" key={k}>
            <div className="sn">{counts?.[k] ?? '—'}</div>
            <div className="sl">{l}</div>
          </div>
        ))}
      </div>

      {err && (
        <div className="card" role="alert"
          style={{ borderColor: '#F09595', background: '#FFF0EE', color: '#E63312', fontSize: 12 }}>{err}</div>
      )}

      <div className="card">
        <div className="ct">Kujt i shkon</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SEGMENTS.map(([k, l]) => (
            <button type="button" key={k} className="btn" aria-pressed={seg === k}
              style={{ background: seg === k ? '#111' : '#f0f0f0', color: seg === k ? '#fff' : '#555' }}
              onClick={() => { setSeg(k); setConfirm(false) }}>
              {l} <span style={{ opacity: .7 }}>({counts?.[k] ?? 0})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="ct">Mesazhi</div>
        <div className="cfg-row">
          <div className="cfg-label">Titulli<div className="cfg-desc">Shfaqet i trashë në njoftim</div></div>
          <input className="finput" style={{ width: 320 }} value={title} maxLength={80}
            aria-label="Titulli" onChange={e => { setTitle(e.target.value); setConfirm(false) }} />
        </div>
        <div className="cfg-row">
          <div className="cfg-label">Teksti<div className="cfg-desc">Deri në 300 karaktere</div></div>
          <input className="finput" style={{ width: 320 }} value={body} maxLength={300}
            aria-label="Teksti" onChange={e => { setBody(e.target.value); setConfirm(false) }} />
        </div>
        <div className="cfg-row">
          <div className="cfg-label">Lidhja<div className="cfg-desc">Opsionale — p.sh. /premium</div></div>
          <input className="finput" style={{ width: 320 }} value={link}
            aria-label="Lidhja" onChange={e => setLink(e.target.value)} />
        </div>

        <div className="save-row">
          {!confirm ? (
            <button type="button" className="save-btn" disabled={!gati} onClick={() => setConfirm(true)}>
              Vazhdo
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-red" disabled={busy} onClick={send}>
                {busy ? 'Duke dërguar…' : `Po, dërgo te ${target} përdorues`}
              </button>
              <button type="button" className="edit-btn" onClick={() => setConfirm(false)}>Anulo</button>
            </>
          )}
        </div>
        {confirm && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#856404', background: '#FFF8E1',
                        border: '1px solid #FFE082', borderRadius: 8, padding: '8px 12px' }}>
            Ky veprim nuk kthehet mbrapsht. Njoftimi shkon menjëherë te {target} inbox-e.
          </div>
        )}
      </div>

      <div className="card">
        <div className="ct">Parapamje</div>
        <div style={{ border: '1px solid #eee', borderRadius: 10, padding: '12px 14px', background: '#FFFBEA' }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#111' }}>{title || 'Titulli i njoftimit'}</div>
          <div style={{ fontSize: 11.5, color: '#666', marginTop: 4, lineHeight: 1.6 }}>
            {body || 'Teksti që do të lexojnë përdoruesit.'}
          </div>
        </div>
      </div>
    </>
  )
}
