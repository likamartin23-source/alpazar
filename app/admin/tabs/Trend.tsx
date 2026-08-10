'use client'

/* Grafik pa asnje varesi te jashtme — shtylla CSS, jo bibliotek.
   Arsyeja: nje bibliotek grafikesh do te rriste bundle-in me ~120KB
   per kater grafike. Kjo ben te njejten pune me ~2KB. */

type Pika = { dita: string; n?: number; shuma?: number; rimbursime?: number }

const dt = (s: string) => {
  const x = new Date(s)
  return `${x.getDate()}/${x.getMonth() + 1}`
}
const nr = (n: number) =>
  Number(n || 0).toLocaleString('sq-AL', { maximumFractionDigits: n % 1 === 0 ? 0 : 2 })

export function Trend({ titull, data, fusha = 'n', ngjyra = '#E63312', njesia = '' }: {
  titull: string
  data: Pika[]
  fusha?: 'n' | 'shuma'
  ngjyra?: string
  njesia?: string
}) {
  const rr = data || []
  const vlerat = rr.map(d => Number((d as any)[fusha] || 0))
  const max = Math.max(1, ...vlerat)
  const total = vlerat.reduce((a, b) => a + b, 0)

  // Krahaso gjysmen e dyte te periudhes me te paren — kjo eshte
  // e vetmja krahasim i ndershem brenda nje serie te vetme.
  const g = Math.floor(vlerat.length / 2)
  const par = vlerat.slice(0, g).reduce((a, b) => a + b, 0)
  const dyt = vlerat.slice(g).reduce((a, b) => a + b, 0)
  const delta = par === 0 ? (dyt > 0 ? null : 0) : Math.round(((dyt - par) / par) * 100)
  const lart = delta !== null && delta > 0
  const posht = delta !== null && delta < 0

  return (
    <div className="card" style={{ minWidth: 0 }}>
      <div className="ct" style={{ marginBottom: 4 }}>{titull}</div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#111', lineHeight: 1 }}>
          {nr(total)}{njesia}
        </div>
        {delta !== null && delta !== 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
            color: lart ? '#1B7F3B' : '#E63312',
            background: lart ? '#E9F7EE' : '#FFF0EE',
          }}>
            {lart ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
        )}
        {delta === null && (
          <span style={{ fontSize: 10, color: '#999' }}>e re</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 74 }}
        role="img" aria-label={`${titull}: ${nr(total)}${njesia} gjithsej`}>
        {rr.map((d, i) => {
          const v = vlerat[i]
          const h = Math.max(2, Math.round((v / max) * 100))
          return (
            <div key={d.dita} title={`${dt(d.dita)} — ${nr(v)}${njesia}`}
              style={{
                flex: 1, height: `${h}%`, minWidth: 2, borderRadius: '2px 2px 0 0',
                background: v === 0 ? '#EFEFEF' : ngjyra,
                opacity: v === 0 ? 1 : 0.35 + 0.65 * (v / max),
              }} />
          )
        })}
        {rr.length === 0 && (
          <div style={{ color: '#bbb', fontSize: 11, alignSelf: 'center' }}>Pa të dhëna.</div>
        )}
      </div>

      {rr.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 9, color: '#bbb' }}>
          <span>{dt(rr[0].dita)}</span>
          <span>{dt(rr[rr.length - 1].dita)}</span>
        </div>
      )}
    </div>
  )
}
