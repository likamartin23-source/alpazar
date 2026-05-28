const LS = { color: '#666' as const, fontSize: 11, textDecoration: 'none' as const }

export default function Kontakt() {
  const css = `
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
    .wrap{max-width:640px;margin:0 auto;background:#FFFBEA;min-height:100vh;}
    .topbar{background:#F5C842;padding:10px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
    .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;flex-shrink:0;}
    .back i{font-size:18px;color:#111;}
    .topbar-title{font-size:15px;font-weight:700;color:#111;}
    .hero{background:#111;padding:32px 20px;text-align:center;}
    .hero-icon{font-size:52px;display:block;margin-bottom:12px;}
    .hero h1{color:#F5C842;font-size:22px;font-weight:700;margin-bottom:8px;}
    .hero p{color:#888;font-size:13px;line-height:1.6;}
    .body{padding:20px 16px 40px;}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;}
    .ccard{background:#fff;border-radius:12px;padding:18px;border:0.5px solid #eee;text-align:center;text-decoration:none;}
    .ccard i{font-size:28px;color:#E63312;display:block;margin-bottom:10px;}
    .ccard strong{font-size:13px;font-weight:700;color:#111;display:block;margin-bottom:4px;}
    .ccard span{font-size:11px;color:#888;}
    .section{background:#fff;border-radius:12px;padding:18px;border:0.5px solid #eee;margin-bottom:14px;}
    .sec-title{font-size:13px;font-weight:700;color:#111;margin-bottom:14px;display:flex;align-items:center;gap:7px;}
    .sec-title i{font-size:16px;color:#E63312;}
    .faq-item{padding:10px 0;border-bottom:0.5px solid #f0f0f0;}
    .faq-item:last-child{border:none;}
    .faq-q{font-size:13px;font-weight:600;color:#111;margin-bottom:5px;}
    .faq-a{font-size:12px;color:#666;line-height:1.7;}
    .hours{display:flex;justify-content:space-between;padding:8px 0;border-bottom:0.5px solid #f0f0f0;font-size:12px;}
    .hours:last-child{border:none;}
    .hours span:first-child{color:#555;}
    .hours span:last-child{color:#111;font-weight:600;}
    .ftr{display:flex;flex-wrap:wrap;gap:8px 16px;padding:20px;background:#f9f9f9;border-top:1px solid #eee;}
    .ftr a{color:#888;font-size:11px;text-decoration:none;}
  `
  return (
    <>
      <style>{css}</style>
      <div className="wrap">
        <div className="topbar">
          <a href="/" className="back"><i className="ti ti-arrow-left" /></a>
          <span className="topbar-title">Kontaktoni</span>
        </div>

        <div className="hero">
          <span className="hero-icon">📬</span>
          <h1>Si mund t'ju ndihmojmë?</h1>
          <p>Ekipi ynë është gjithmonë gati<br />t'ju ndihmojë me çdo pyetje</p>
        </div>

        <div className="body">
          <div className="cards">
            <a href="mailto:likamartin23@gmail.com" className="ccard">
              <i className="ti ti-mail" />
              <strong>Email</strong>
              <span>likamartin23@gmail.com</span>
            </a>
            <a href="mailto:likamartin23@gmail.com" className="ccard">
              <i className="ti ti-headset" />
              <strong>Mbështetje</strong>
              <span>likamartin23@gmail.com</span>
            </a>
            <a href="mailto:likamartin23@gmail.com" className="ccard">
              <i className="ti ti-scale" />
              <strong>Çështje Ligjore</strong>
              <span>likamartin23@gmail.com</span>
            </a>
            <a href="mailto:likamartin23@gmail.com" className="ccard">
              <i className="ti ti-alert-triangle" />
              <strong>Raporto Abuzim</strong>
              <span>likamartin23@gmail.com</span>
            </a>
          </div>

          <div className="section">
            <div className="sec-title"><i className="ti ti-clock" />Oraret e Mbështetjes</div>
            <div className="hours"><span>E Hënë — E Premte</span><span>09:00 — 18:00</span></div>
            <div className="hours"><span>E Shtunë</span><span>10:00 — 14:00</span></div>
            <div className="hours"><span>E Dielë</span><span>Mbyllur</span></div>
            <div className="hours"><span>Përgjigje me email</span><span>Brenda 24 orësh</span></div>
          </div>

          <div className="section">
            <div className="sec-title"><i className="ti ti-help-circle" />Pyetjet e Shpeshta</div>
            <div className="faq-item">
              <div className="faq-q">Si ta fshij llogarinë time?</div>
              <div className="faq-a">Dërgoni email në likamartin23@gmail.com me subjektin "Fshirja e llogarisë". Procesojmë brenda 30 ditësh si kërkon ligji.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Si ta raportoj një shpallje mashtruese?</div>
              <div className="faq-a">Klikoni butonin "Raporto" në shpallje ose dërgoni email në likamartin23@gmail.com me ID-në e shpalljes.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Si funksionon pagesa Premium?</div>
              <div className="faq-a">Zgjidhni planin, dërgoni kërkesën, dhe admini konfirmon pagesën manualisht brenda 24 orësh. Nuk ofrojmë pagesa automatike me kartë tani.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Ku janë serverët tuaj?</div>
              <div className="faq-a">Serverët janë të hostuar në Bashkimin Europian (Supabase/Vercel) me mbrojtje të plotë GDPR.</div>
            </div>
          </div>

          <div className="section">
            <div className="sec-title"><i className="ti ti-map-pin" />Adresa</div>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7 }}>
              Alpazar<br />
              Tiranë, Shqipëri<br />
              <span style={{ fontSize: 11, color: '#888' }}>NIPT/QKB: (në regjistrim)</span>
            </p>
          </div>
        </div>

        <div className="ftr">
          <a href="/kushtet" style={LS}>Kushtet</a>
          <a href="/privatesia" style={LS}>Privatësia</a>
          <a href="/cookies" style={LS}>Cookie-t</a>
          <a href="/rreth-nesh" style={LS}>Rreth Nesh</a>
          <a href="/siguria" style={LS}>Siguria</a>
          <a href="/" style={LS}>← Kreu</a>
        </div>
      </div>
    </>
  )
}
