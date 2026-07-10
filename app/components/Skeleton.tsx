'use client'

const shimmer = `
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .sk {
    background: linear-gradient(90deg, #f0ede0 25%, #e8e4d0 50%, #f0ede0 75%);
    background-size: 800px 100%;
    animation: shimmer 1.4s infinite linear;
    border-radius: 6px;
  }
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
        {/* Fotoja */}
        <div className="sk" style={{ width: '100%', height: 140 }} />
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
      <div role="status" aria-busy="true" aria-label="Duke ngarkuar..." style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10, padding: '0 13px',
      }}>
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
