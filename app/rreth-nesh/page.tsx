const LS = { color: '#666' as const, fontSize: 11, textDecoration: 'none' as const }

export default function RrethNesh() {
  const css = `
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
    .wrap{max-width:640px;margin:0 auto;background:#FFFBEA;min-height:100vh;}
    .topbar{background:linear-gradient(165deg,#F8D24E 0%,#F5C842 52%,#EEB828 100%);padding:10px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
    .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;flex-shrink:0;}
    .back i{font-size:18px;color:#111;}
    .topbar-title{font-size:15px;font-weight:700;color:#111;}
    .hero{background:#111;padding:36px 20px;text-align:center;position:relative;overflow:hidden;}
    .hero::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#E63312,#F5C842);}
    .hero-logo{font-size:56px;display:block;margin-bottom:14px;}
    .hero h1{color:#F5C842;font-size:24px;font-weight:700;letter-spacing:2px;margin-bottom:8px;}
    .hero p{color:#888;font-size:13px;line-height:1.7;}
    .body{padding:20px 16px 40px;}
    .section{background:#fff;border-radius:12px;padding:20px;border:0.5px solid #eee;margin-bottom:14px;}
    .sec-title{font-size:15px;font-weight:700;color:#111;margin-bottom:14px;display:flex;align-items:center;gap:8px;}
    .sec-title i{font-size:18px;color:#E63312;}
    p{font-size:13px;color:#444;line-height:1.85;margin-bottom:10px;}
    p:last-child{margin-bottom:0;}
    .values{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px;}
    .val{background:#FFFBEA;border:0.5px solid #e0b030;border-radius:10px;padding:14px;text-align:center;}
    .val i{font-size:24px;color:#E63312;display:block;margin-bottom:8px;}
    .val strong{font-size:12px;font-weight:700;color:#111;display:block;margin-bottom:4px;}
    .val span{font-size:11px;color:#666;}
    .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:4px;}
    .stat{background:#111;border-radius:10px;padding:14px;text-align:center;}
    .stat-n{font-size:22px;font-weight:700;color:#F5C842;}
    .stat-l{font-size:10px;color:#666;margin-top:4px;}
    .timeline{position:relative;padding-left:20px;}
    .tl-item{position:relative;padding-bottom:20px;}
    .tl-item::before{content:'';position:absolute;left:-16px;top:5px;width:8px;height:8px;border-radius:50%;background:#F5C842;}
    .tl-item::after{content:'';position:absolute;left:-13px;top:13px;width:2px;bottom:0;background:#e0b030;}
    .tl-item:last-child::after{display:none;}
    .tl-date{font-size:11px;font-weight:700;color:#E63312;margin-bottom:3px;}
    .tl-text{font-size:12px;color:#555;line-height:1.6;}
    .ftr{display:flex;flex-wrap:wrap;gap:8px 16px;padding:20px;background:#f9f9f9;border-top:1px solid #eee;}
    .ftr a{color:#888;font-size:11px;text-decoration:none;}
  `
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="wrap">
        <div className="topbar">
          <a href="/" className="back" aria-label="Kthehu mbrapa"><i className="ti ti-arrow-left" aria-hidden="true" /></a>
          <span className="topbar-title">Rreth Nesh</span>
        </div>

        <div className="hero">
          <img src="/icons/eagle.svg" alt="" className="hero-logo" aria-hidden="true" />
          <h1>ALPAZAR</h1>
          <p>Shit · Bli · Bëj Pazrin Tënd<br />Platforma #1 shqiptare e tregtisë online</p>
        </div>

        <div className="body">
          <div className="section">
            <h2 className="sec-title"><i className="ti ti-bulb" aria-hidden="true" />Historia jonë</h2>
            <p>Alpazar lindi nga një ide e thjeshtë: shqiptarët meritojnë një platformë tregtie online moderne, pa reklama, dhe falas — një hapësirë ku çdo gjë mund të shitet dhe blihet me besim.</p>
            <p>Emri "Alpazar" kombinon "Al" (Shqipëria) me "pazar" (tregti, shkëmbim) — reflektim i traditës sonë historikë të tregtisë dhe komunitetit.</p>
            <p>Ne besojmë se teknologjia duhet t'i shërbejë njerëzve, jo reklamuesve. Kjo është arsyeja pse Alpazar ka zero reklama — gjithmonë.</p>
          </div>

          <div className="section">
            <h2 className="sec-title"><i className="ti ti-target" aria-hidden="true" />Misioni ynë</h2>
            <p>Të bëhemi platforma #1 e tregtisë online në Shqipëri — e besueshme, e sigurt, dhe e aksesueshme për të gjithë shqiptarët kudo ku janë.</p>
            <div className="values">
              <div className="val">
                <i className="ti ti-shield-check" aria-hidden="true" />
                <strong>Besueshmëri</strong>
                <span>Shitës të verifikuar, raportim i shpejtë</span>
              </div>
              <div className="val">
                <i className="ti ti-ad-off" aria-hidden="true" />
                <strong>Zero Reklama</strong>
                <span>Asnjëherë — për të gjithë gjithmonë</span>
              </div>
              <div className="val">
                <i className="ti ti-heart" aria-hidden="true" />
                <strong>Komunitet</strong>
                <span>Ndërtuar nga shqiptarët, për shqiptarët</span>
              </div>
              <div className="val">
                <i className="ti ti-lock" aria-hidden="true" />
                <strong>Siguri</strong>
                <span>Të dhënat tuaja janë të mbrojtura</span>
              </div>
            </div>
          </div>

          <div className="section">
            <h2 className="sec-title"><i className="ti ti-chart-bar" aria-hidden="true" />Alpazar në numra</h2>
            <div className="stats">
              <div className="stat">
                <div className="stat-n">0€</div>
                <div className="stat-l">Kosto për shpallje</div>
              </div>
              <div className="stat">
                <div className="stat-n">0</div>
                <div className="stat-l">Reklama në platformë</div>
              </div>
              <div className="stat">
                <div className="stat-n">24/7</div>
                <div className="stat-l">Disponueshmëri</div>
              </div>
            </div>
          </div>

          <div className="section">
            <h2 className="sec-title"><i className="ti ti-clock" aria-hidden="true" />Historia</h2>
            <div className="timeline">
              <div className="tl-item">
                <div className="tl-date">2024 — Fillimi</div>
                <div className="tl-text">Ideja lind: Shqipëria ka nevojë për platformën e vet të tregtisë online pa reklama.</div>
              </div>
              <div className="tl-item">
                <div className="tl-date">2025 — Lansimi</div>
                <div className="tl-text">Alpazar lansohet me kategorinë e parë: Elektronikë, Automjete, Prona, dhe Kafshë.</div>
              </div>
              <div className="tl-item">
                <div className="tl-date">2025 — Premium</div>
                <div className="tl-text">Lansimi i shërbimit Premium — dyqan personal, badge verifikimi, statistika të avancuara.</div>
              </div>
              <div className="tl-item">
                <div className="tl-date">E ardhmja</div>
                <div className="tl-text">Aplikacion mobil, sistemi i vlerësimeve, dhe ekspansion në gjithë diasporën shqiptare.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="ftr">
          <a href="/kushtet" style={LS}>Kushtet</a>
          <a href="/privatesia" style={LS}>Privatësia</a>
          <a href="/cookies" style={LS}>Cookie-t</a>
          <a href="/kontakt" style={LS}>Kontakt</a>
          <a href="/siguria" style={LS}>Siguria</a>
          <a href="/" style={LS}>← Kreu</a>
        </div>
      </div>
    </>
  )
}
