'use client'

export const PERIODS = [
  { k: 'monthly', l: 'Mujor' },
  { k: 'quarterly', l: '3-mujor' },
  { k: 'yearly', l: 'Vjetor' },
]

export const L = (n: any) => Number(n || 0).toLocaleString('sq-AL', { maximumFractionDigits: 2 })

export function TierTabs({ tier, onPick, pricing }: any) {
  return (
    <div className="tiers" role="tablist" aria-label="Lloji i planit">
      <button type="button" role="tab" aria-selected={tier === 'premium'}
        className={`tr ${tier === 'premium' ? 'on' : ''}`} onClick={() => onPick('premium')}>
        <b>Premium</b>
        <span>nga {L(pricing?.cheapest_monthly_all)} L/muaj</span>
      </button>
      <button type="button" role="tab" aria-selected={tier === 'boost'}
        className={`tr boost ${tier === 'boost' ? 'on' : ''}`} onClick={() => onPick('boost')}>
        <b>Ekstra Boost ⚡</b>
        <span>nga {L(pricing?.boost_from_all)} L/muaj</span>
      </button>
    </div>
  )
}

export function Hero({ tier }: any) {
  return (
    <div className="hero">
      <div className="hero-t">
        {tier === 'premium' ? 'Të gjitha përfitimet, pa asnjë limit' : 'Shikueshmëri maksimale'}
      </div>
      <div className="hero-s">
        {tier === 'premium'
          ? 'Të gjithë përdoruesit Premium janë të barabartë — shpallje pa limit, vend i parë, profil biznesi dhe postime pa limit.'
          : 'Ekstra Boost të ngre mbi të gjithë të tjerët: kreu absolut i listës, rrotullim në faqen kryesore dhe prioritet maksimal në kërkim.'}
      </div>
    </div>
  )
}

export function PeriodSeg({ period, onPick }: any) {
  return (
    <div className="seg" role="tablist" aria-label="Periudha e faturimit">
      {PERIODS.map(pd => (
        <button key={pd.k} type="button" role="tab" aria-selected={period === pd.k}
          className={`sg ${period === pd.k ? 'on' : ''}`} onClick={() => onPick(pd.k)}>
          {pd.l}{pd.k !== 'monthly' && <span className="save">−17%</span>}
        </button>
      ))}
    </div>
  )
}

export function PlanCard({ p, selected, locked, onPick }: any) {
  return (
    <button type="button" aria-pressed={selected} disabled={locked}
      className={`plan ${selected ? 'on' : ''} ${p.is_featured ? 'feat' : ''} ${locked ? 'lock' : ''}`}
      onClick={() => onPick(p.id)}>
      <div className="p-top">
        <div>
          <div className="p-name">
            {p.name}{p.is_featured && <span className="tag">Më i zgjedhuri</span>}
          </div>
          <div className="p-desc">
            {p.months > 1
              ? `${L(p.price_all_per_month)} L/muaj · faturuar çdo ${p.months} muaj`
              : 'Faturim mujor'}
          </div>
        </div>
        <div className="p-price">
          <b>{L(p.price_all)} L</b>
          <span>{p.price_eur} €</span>
        </div>
      </div>
      {p.badge && <div className="p-badge">{p.badge}</div>}
      <ul className="feat-list">
        {(Array.isArray(p.features) ? p.features : []).map((f: string, i: number) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
    </button>
  )
}

export function PayBox({ methods, methodId, setMethodId, sel, busy, planId, owned, onSubmit }: any) {
  return (
    <div className="card">
      <div className="sec-t">Metoda e pagesës</div>
      {methods.length === 0 && <div className="muted">Asnjë metodë aktive. Kontakto administratën.</div>}
      {methods.map((m: any) => (
        <button key={m.id} type="button" aria-pressed={methodId === m.id}
          className={`pm ${methodId === m.id ? 'on' : ''}`} onClick={() => setMethodId(m.id)}>
          <i className={`ti ti-${m.type === 'card' ? 'credit-card' : m.type === 'paypal' ? 'brand-paypal' : m.type === 'mobile' ? 'device-mobile' : 'building-bank'}`} aria-hidden="true" />
          {m.name}
          {methodId === m.id && <i className="ti ti-circle-check ok" aria-hidden="true" />}
        </button>
      ))}
      {sel && (
        <div className="total">
          <span>Totali për {sel.months} muaj</span>
          <b>{L(sel.price_all)} L</b>
        </div>
      )}
      <button type="button" className="cta" disabled={busy || !planId || !methodId} onClick={onSubmit}>
        {busy ? 'Duke dërguar…' : owned ? 'Zgjat abonimin' : 'Abonohu tani'}
      </button>
      <div className="muted small">
        Pagesa konfirmohet nga administrata dhe përfitimet hyjnë në fuqi menjëherë. Anulo kurdo te “Plani im”.
      </div>
    </div>
  )
}
