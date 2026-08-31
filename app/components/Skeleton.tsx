'use client'

const shimmer = `
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .sk {
    background: linear-gradient(90deg, #efeadb 0%, #efeadb 20%, #faf7ee 50%, #efeadb 80%, #efeadb 100%);
    background-size: 800px 100%;
    animation: shimmer 1.6s cubic-bezier(.4,0,.6,1) infinite;
    border-radius: 6px;
  }
  @media (prefers-reduced-motion: reduce){ .sk{ animation: none; } }
`

/* ─── Skeleton një kartë shpalljeje (listing card) ───────────────────── */
export function SkeletonCard() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shimmer }} />
      <div role="status" aria-busy="true" aria-label="Duke ngarkuar..." style={{
        background: '#fff', borderRadius: 12, overflow: 'hidden',
        border: '0.5px solid #eee', flexShrink: 0,
      }}>
        {/* Fotoja — RAPORT, jo lartesi fikse.
            `.listing-card` reale e ka median me `aspect-ratio:4/3`
            (app/ui-refine.css). Nje lartesi fikse 140px perputhej vetem ne nje
            gjeresi te vetme; ne cdo tjeter, zevendesimi i skeletonit me kartat
            reale i zhvendoste te gjitha me poshte. */}
        <div className="sk" style={{ width: '100%', aspectRatio: '4 / 3' }} />
        {/* Body */}
        <div style={{ padding: '8px 10px 10px' }}>
          <div className="sk" style={{ height: 13, width: '80%', marginBottom: 6 }} />
          <div className="sk" style={{ height: 13, width: '55%', marginBottom: 8 }} />
          <div className="sk" style={{ height: 16, width: '45%', marginBottom: 6 }} />
          <div style={{ display: 'flex', gap: 5 }}>
            <div className="sk" style={{ height: 20, width: 52, borderRadius: 12 }} />
            <div className="sk" style={{ height: 20, width: 60, borderRadius: 12 }} />
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Grid me N skeleton cards ──────────────────────────────────────── */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shimmer }} />
      {/*  I NJEJTI grid si permbajtja reale, jo nje kopje me numra te ngjashem.
          Me pare skeletoni kishte rrjetin e vet — `repeat(2,1fr)`, gap 10,
          padding 13 — ndersa `.listings-grid` ka `auto-fill minmax(150px,1fr)`
          me `var(--sp-3)` dhe pa padding. Ndryshimi i gjeometrise ne castin e
          zevendesimit ishte burimi kryesor i kercimit: CLS 0.206 ne kryefaqe,
          matur me 31 gusht 2026 mbi ndertimin e prodhimit, ne telefon te
          ngadalesuar. Duke perdorur te njejten klase, perputhja mbetet e sakte
          ne CDO breakpoint, jo vetem ne ate qe u provua.  */}
      <div role="status" aria-busy="true" aria-label="Duke ngarkuar…" className="listings-grid">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </>
  )
}

/* ─── Skeleton rresht liste (profile, messages) ──────────────────────── */
export function SkeletonRow() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shimmer }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
        <div className="sk" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="sk" style={{ height: 13, width: '65%', marginBottom: 6 }} />
          <div className="sk" style={{ height: 11, width: '40%' }} />
        </div>
        <div className="sk" style={{ height: 11, width: 36, borderRadius: 10 }} />
      </div>
    </>
  )
}

/* ─── Lista me N skeleton rows ──────────────────────────────────────── */
export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shimmer }} />
      <div role="status" aria-busy="true" aria-label="Duke ngarkuar...">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>
            <SkeletonRow />
            {i < count - 1 && <div style={{ height: 1, background: '#f0f0f0', margin: '0 14px' }} />}
          </div>
        ))}
      </div>
    </>
  )
}

/* ─── Skeleton block teksti (profile, listing detail) ───────────────── */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  const widths = ['100%', '85%', '70%', '90%', '60%']
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shimmer }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="sk"
            style={{ height: 12, width: widths[i % widths.length] }}
          />
        ))}
      </div>
    </>
  )
}

/* ─── Skeleton kartë profili shitësi ────────────────────────────────── */
export function SkeletonProfile() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shimmer }} />
      <div style={{ padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div className="sk" style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="sk" style={{ height: 15, width: '60%', marginBottom: 8 }} />
            <div className="sk" style={{ height: 12, width: '40%' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[50, 70, 55].map((w, i) => (
            <div key={i} className="sk" style={{ height: 24, width: w, borderRadius: 12 }} />
          ))}
        </div>
        <SkeletonText lines={2} />
      </div>
    </>
  )
}
