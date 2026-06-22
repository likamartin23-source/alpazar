const LS = { color: '#666' as const, fontSize: 11, textDecoration: 'none' as const }

export default function Siguria() {
  const css = `
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
    .wrap{max-width:640px;margin:0 auto;background:#FFFBEA;min-height:100vh;}
    .topbar{background:#F5C842;padding:10px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
    .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;flex-shrink:0;}
    .back i{font-size:18px;color:#111;}
    .topbar-title{font-size:15px;font-weight:700;color:#111;}
    .hero{background:#E63312;padding:28px 20px;text-align:center;}
    .hero-icon{font-size:48px;display:block;margin-bottom:12px;}
    .hero h1{color:#fff;font-size:20px;font-weight:700;margin-bottom:6px;}
    .hero p{color:rgba(255,255,255,.8);font-size:13px;line-height:1.6;}
    .body{padding:16px 14px 40px;}
    .alert{background:#FFF0EE;border:1px solid #F09595;border-radius:10px;padding:14px 16px;margin-bottom:14px;display:flex;align-items:flex-start;gap:10px;}
    .alert i{font-size:20px;color:#E63312;flex-shrink:0;margin-top:2px;}
    .alert-text strong{font-size:13px;font-weight:700;color:#E63312;display:block;margin-bottom:4px;}
    .alert-text span{font-size:12px;color:#666;line-height:1.6;}
    .section{background:#fff;border-radius:12px;padding:18px;border:0.5px solid #eee;margin-bottom:12px;}
    .sec-title{font-size:13px;font-weight:700;color:#111;margin-bottom:12px;display:flex;align-items:center;gap:7px;}
    .sec-title i{font-size:16px;color:#E63312;}
    .tip{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:0.5px solid #f5f5f5;}
    .tip:last-child{border:none;}
    .tip-icon{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .t-green{background:#EAF3DE;}
    .t-green i{color:#3B6D11;}
    .t-red{background:#FFF0EE;}
    .t-red i{color:#E63312;}
    .tip-icon i{font-size:14px;}
    .tip-text strong{font-size:12px;font-weight:700;color:#111;display:block;margin-bottom:2px;}
    .tip-text span{font-size:11px;color:#666;line-height:1.6;}
    .red-btn{display:block;background:#E63312;color:#fff;text-align:center;border-radius:10px;padding:13px;font-size:14px;font-weight:700;text-decoration:none;margin-top:4px;}
    .ftr{display:flex;flex-wrap:wrap;gap:8px 16px;padding:20px;background:#f9f9f9;border-top:1px solid #eee;}
    .ftr a{color:#888;font-size:11px;text-decoration:none;}
  `
  return (
    <>
      <style>{css}</style>
      <div className="wrap">
        <div className="topbar">
          <a href="/" className="back" aria-label="Kthehu mbrapa"><i className="ti ti-arrow-left" aria-hidden="true" /></a>
          <span className="topbar-title">Siguria</span>
        </div>

        <div className="hero">
          <span className="hero-icon" aria-hidden="true">🛡️</span>
          <h1>Tregto me Siguri</h1>
          <p>Këshilla dhe paralajmërime<br />për t'u mbrojtur nga mashtrimet</p>
        </div>

        <div className="body">
          <div className="alert">
            <i className="ti ti-alert-triangle" aria-hidden="true" />
            <div className="alert-text">
              <strong>Kurrë mos paguani paraprakisht!</strong>
              <span>Mashtrimet më të shpeshta fillojnë me kërkesën për pagesë përpara takimit fizik ose dorëzimit të produktit. Kini kujdes gjithmonë.</span>
            </div>
          </div>

          <div className="section">
            <h2 className="sec-title"><i className="ti ti-shield-check" aria-hidden="true" />Si të Blini me Siguri</h2>
            <div className="tip">
              <div className="tip-icon t-green"><i className="ti ti-check" aria-hidden="true" /></div>
              <div className="tip-text"><strong>Takohuni personalisht</strong><span>Gjithmonë takohuni në vende publike për të shikuar produktin para pagesës</span></div>
            </div>
            <div className="tip">
              <div className="tip-icon t-green"><i className="ti ti-check" aria-hidden="true" /></div>
              <div className="tip-text"><strong>Kontrolloni produktin</strong><span>Testoni elektronikën, kontrolloni dokumentet e automjetit, shikoni pronën para çdo pagese</span></div>
            </div>
            <div className="tip">
              <div className="tip-icon t-green"><i className="ti ti-check" aria-hidden="true" /></div>
              <div className="tip-text"><strong>Shmangni transfertat bankare</strong><span>Mos transferoni para kurrë pa e parë produktin. Preferoni pagesën fizike në dorë</span></div>
            </div>
            <div className="tip">
              <div className="tip-icon t-red"><i className="ti ti-x" aria-hidden="true" /></div>
              <div className="tip-text"><strong>Mos i besoni "ofertave tepër të mira"</strong><span>iPhone 15 Pro me 50€? Ndoshta mashtrim. Çmimet shumë poshtë tregut janë flamur i kuq</span></div>
            </div>
            <div className="tip">
              <div className="tip-icon t-red"><i className="ti ti-x" aria-hidden="true" /></div>
              <div className="tip-text"><strong>Mos paguani me dhurata/kartëmonedha</strong><span>Kurrë mos dërgoni para me Western Union, kartëmonedha, apo kriptomonedhë te të panjohur</span></div>
            </div>
          </div>

          <div className="section">
            <h2 className="sec-title"><i className="ti ti-tag" aria-hidden="true" />Si të Shisni me Siguri</h2>
            <div className="tip">
              <div className="tip-icon t-green"><i className="ti ti-check" aria-hidden="true" /></div>
              <div className="tip-text"><strong>Fotografitë origjinale</strong><span>Postoni vetëm foto tuajat — fotografitë e interneti-t tregojnë mungesë vullneti të mirë</span></div>
            </div>
            <div className="tip">
              <div className="tip-icon t-green"><i className="ti ti-check" aria-hidden="true" /></div>
              <div className="tip-text"><strong>Çmim i drejtë</strong><span>Çmimet e arsyeshme tërheqin blerës seriozë dhe mbrojnë reputacionin tuaj</span></div>
            </div>
            <div className="tip">
              <div className="tip-icon t-red"><i className="ti ti-x" aria-hidden="true" /></div>
              <div className="tip-text"><strong>Mos jepni të dhëna personale</strong><span>Kurrë mos ndani numrin e kartës, fjalëkalimin, ose kopjet e dokumenteve me blerës</span></div>
            </div>
          </div>

          <div className="section">
            <h2 className="sec-title"><i className="ti ti-flag" aria-hidden="true" />Si të Raportoni</h2>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 12 }}>
              Nëse hasni një shpallje mashtruese ose sjellje abuzive, raportojeni menjëherë. Ekipi ynë shqyrton çdo raportim brenda 24 orësh.
            </p>
            <a href="mailto:likamartin23@gmail.com" className="red-btn">
              <><span aria-hidden="true">🚨</span> Raporto tani — likamartin23@gmail.com</>
            </a>
          </div>

          <div className="section">
            <h2 className="sec-title"><i className="ti ti-phone" aria-hidden="true" />Numrat e Emergjencës</h2>
            <div className="tip">
              <div className="tip-icon t-red"><i className="ti ti-phone" aria-hidden="true" /></div>
              <div className="tip-text"><strong>Policia e Shtetit</strong><span>129 (emergjencë) · 0800 33 33 (pa pagesë)</span></div>
            </div>
            <div className="tip">
              <div className="tip-icon t-red"><i className="ti ti-building" aria-hidden="true" /></div>
              <div className="tip-text"><strong>Prokuroria</strong><span>Për regjistrim ankese formale për mashtrim</span></div>
            </div>
            <div className="tip">
              <div className="tip-icon t-green"><i className="ti ti-shield" aria-hidden="true" /></div>
              <div className="tip-text"><strong>CERT Albania</strong><span>cert.gov.al — për incidente kibernetike</span></div>
            </div>
          </div>
        </div>

        <div className="ftr">
          <a href="/kushtet" style={LS}>Kushtet</a>
          <a href="/privatesia" style={LS}>Privatësia</a>
          <a href="/cookies" style={LS}>Cookie-t</a>
          <a href="/rreth-nesh" style={LS}>Rreth Nesh</a>
          <a href="/kontakt" style={LS}>Kontakt</a>
          <a href="/" style={LS}>← Kreu</a>
        </div>
      </div>
    </>
  )
}
