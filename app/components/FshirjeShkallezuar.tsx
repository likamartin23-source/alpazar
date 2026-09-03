'use client'
import { useState } from 'react'

/**
 * FSHIRJE E SHKALLËZUAR — një komponent i VETËM për çdo fshirje shkatërruese
 * (llogari, biznes). Urdhër pronari (2 shtator 2026): "sistemi i fshirjes së
 * biznesit dhe fshirjes së përdoruesit duhet të jetë I NJËJTË; në një konfirmim
 * duhet të jetë fjalëkalimi i përdoruesit."
 *
 * TRI SHKALLË (si modeli i biznesit §3.9):
 *   0 → butoni hapës
 *   1 → paralajmërim (Anulo · Vazhdo)
 *   2 → konfirmim me sekret (Anulo · Fshij përfundimisht)
 *   3 → duke fshirë
 *
 * Konfirmimi bëhet me EMRIN (biznesi — identifikues publik) ose me FJALËKALIMIN
 * (llogaria — sekreti natyror). `onFshi` merr sekretin, kthen mesazh gabimi ose
 * `null` në sukses (fjalëkalimi i gabuar kapet aty dhe kthen te shkalla 2).
 *
 * Rregullat Alpazar: CSS inline i tokenizuar (var(--az-*)), pa hex të ri, JO Tailwind.
 */
export type TipKonfirmimi = 'emri' | 'fjalëkalimi'

export default function FshirjeShkallezuar({
  butoniHapja,
  titull,
  paralajmerim,
  tip,
  emriPritur = '',
  onFshi,
}: {
  butoniHapja: string
  titull: string
  paralajmerim: React.ReactNode
  tip: TipKonfirmimi
  emriPritur?: string
  onFshi: (sekret: string) => Promise<string | null>
}) {
  const [stage, setStage] = useState(0)
  const [sekret, setSekret] = useState('')
  const [err, setErr] = useState('')

  const vlefshem = tip === 'emri'
    ? emriPritur.trim() !== '' && sekret.trim() === emriPritur.trim()
    : sekret.length > 0

  async function kryej() {
    if (!vlefshem) return
    setStage(3); setErr('')
    const gabim = await onFshi(sekret)
    if (gabim) { setErr(gabim); setStage(2); return }
    // Sukses: prindi ridrejton/rifreskon; mbetemi te "⏳ Duke fshirë...".
  }

  const reset = () => { setStage(0); setSekret(''); setErr('') }

  const btn: React.CSSProperties = {
    flex: 1, borderRadius: 'var(--r-btn)', padding: '10px', fontSize: 13,
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  }
  const btnAnulo: React.CSSProperties = { ...btn, background: 'var(--az-white)', border: '1px solid var(--az-line)', color: 'var(--az-black)' }

  return (
    <div style={{ marginTop: 8 }}>
      {stage === 0 && (
        <button type="button" onClick={() => setStage(1)}
          style={{ ...btn, width: '100%', flex: undefined, background: 'none', border: '1px solid var(--az-red)', color: 'var(--az-red-deep)' }}>
          <span aria-hidden="true">🗑</span> {butoniHapja}
        </button>
      )}
      {stage >= 1 && (
        <div style={{ border: '1.5px solid var(--az-red)', borderRadius: 'var(--r-panel)', padding: 14, background: 'rgba(230,51,18,.06)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--az-red-deep)', marginBottom: 6 }}>⚠️ {titull}</div>

          {stage === 1 && (
            <>
              <div style={{ fontSize: 12, color: 'var(--az-gray-1)', lineHeight: 1.6, marginBottom: 12 }}>{paralajmerim}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={reset} style={btnAnulo}>Anulo</button>
                <button type="button" onClick={() => setStage(2)} style={{ ...btn, background: 'var(--az-red-deep)', color: 'var(--az-white)', border: 'none' }}>Vazhdo</button>
              </div>
            </>
          )}

          {stage === 2 && (
            <>
              <p style={{ fontSize: 12, color: 'var(--az-gray-1)', marginBottom: 8 }}>
                {tip === 'emri'
                  ? <>Për të konfirmuar, shkruaj emrin: <b>{emriPritur}</b></>
                  : <>Për të konfirmuar, shkruaj <b>fjalëkalimin</b> tënd.</>}
              </p>
              <input
                type={tip === 'fjalëkalimi' ? 'password' : 'text'}
                value={sekret}
                onChange={e => setSekret(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') kryej() }}
                placeholder={tip === 'emri' ? emriPritur : 'Fjalëkalimi'}
                autoComplete={tip === 'fjalëkalimi' ? 'current-password' : 'off'}
                aria-label={tip === 'fjalëkalimi' ? 'Fjalëkalimi për konfirmim fshirjeje' : 'Emri për konfirmim fshirjeje'}
                style={{ width: '100%', border: '1.5px solid var(--az-red)', borderRadius: 'var(--r-btn)', padding: '9px 11px', fontSize: 13, fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
              />
              {err && <div role="alert" style={{ fontSize: 12, color: 'var(--az-red-deep)', fontWeight: 700, marginBottom: 8 }}>{err}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={reset} style={btnAnulo}>Anulo</button>
                <button type="button" disabled={!vlefshem} onClick={kryej}
                  style={{ ...btn, fontWeight: 800, background: 'var(--az-red-deep)', color: 'var(--az-white)', border: 'none', opacity: vlefshem ? 1 : 0.45, cursor: vlefshem ? 'pointer' : 'not-allowed' }}>
                  Fshij përfundimisht
                </button>
              </div>
            </>
          )}

          {stage === 3 && <div style={{ fontSize: 13, color: 'var(--az-red-deep)', fontWeight: 700 }}>⏳ Duke fshirë...</div>}
        </div>
      )}
    </div>
  )
}
