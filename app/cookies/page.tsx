const LS = { color: '#666' as const, fontSize: 11, textDecoration: 'none' as const }

export default function CookiesPage() {
  const css = `
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
    .wrap{max-width:640px;margin:0 auto;background:#fff;min-height:100vh;}
    .topbar{background:#F5C842;padding:10px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
    .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;flex-shrink:0;}
    .back i{font-size:18px;color:#111;}
    .topbar-title{font-size:15px;font-weight:700;color:#111;}
    .content{padding:24px 20px 40px;}
    .ver{font-size:11px;color:#888;margin-bottom:20px;background:#FFFBEA;padding:8px 12px;border-radius:8px;display:inline-block;}
    h1{font-size:22px;font-weight:700;color:#111;margin-bottom:8px;}
    h2{font-size:14px;font-weight:700;color:#111;margin:22px 0 8px;padding-bottom:5px;border-bottom:2px solid #F5C842;}
    p{font-size:13px;color:#444;line-height:1.85;margin-bottom:10px;}
    ul{font-size:13px;color:#444;line-height:1.85;padding-left:18px;margin-bottom:10px;}
    li{margin-bottom:5px;}
    table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:14px;}
    th{background:#FFFBEA;padding:8px 10px;text-align:left;border-bottom:2px solid #F5C842;font-size:11px;font-weight:700;color:#555;}
    td{padding:8px 10px;border-bottom:0.5px solid #f0f0f0;color:#444;vertical-align:top;}
    .note{background:#FFFBEA;border-left:3px solid #F5C842;padding:10px 14px;border-radius:0 8px 8px 0;margin:12px 0;font-size:12px;color:#555;}
    .ftr{display:flex;flex-wrap:wrap;gap:8px 16px;padding:20px;background:#f9f9f9;border-top:1px solid #eee;margin-top:10px;}
    .ftr a{color:#888;font-size:11px;text-decoration:none;}
  `
  return (
    <>
      <style>{css}</style>
      <div className="wrap">
        <div className="topbar">
          <a href="/" className="back"><i className="ti ti-arrow-left" /></a>
          <span className="topbar-title">Politika e Cookie-ve</span>
        </div>
        <div className="content">
          <h1>Politika e Cookie-ve</h1>
          <div className="ver">Versioni 1.0 · Janar 2025</div>

          <h2>1. Çfarë janë Cookie-t?</h2>
          <p>Cookie-t janë skedarë të vegjël teksti që ruhen në pajisjen tuaj kur vizitoni një faqe interneti. Alpazar i përdor cookie-t ekskluzivisht për funksionimin teknik të platformës — <strong>pa reklama, pa gjurmim marketingu</strong>.</p>

          <h2>2. Cookie-t që Përdorim</h2>
          <table>
            <thead>
              <tr><th>Cookie</th><th>Lloji</th><th>Qëllimi</th><th>Kohëzgjatja</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><code>sb-*-auth-token</code></td>
                <td>I detyrueshëm</td>
                <td>Sesioni i autentikimit — mban hyrjen aktive</td>
                <td>7 ditë</td>
              </tr>
              <tr>
                <td><code>sb-*-auth-token-code-verifier</code></td>
                <td>I detyrueshëm</td>
                <td>Siguria e hyrjes OAuth (PKCE)</td>
                <td>Sesioni</td>
              </tr>
              <tr>
                <td><code>__vercel_live_token</code></td>
                <td>Teknik</td>
                <td>Preview deployments (vetëm zhvillim)</td>
                <td>Sesioni</td>
              </tr>
            </tbody>
          </table>

          <div className="note">
            Alpazar <strong>NUK</strong> përdor cookie analitike (Google Analytics, Mixpanel etj.), cookie reklamimi (Facebook Pixel etj.) apo cookie gjurmimi të palëve të treta. Zero reklama — gjithmonë.
          </div>

          <h2>3. Cookie-t e Detyrueshëm</h2>
          <p>Cookie-t e sesionit të Supabase janë teknikisht të nevojshme për funksionimin e hyrjes në platformë. Pa to, nuk mund të qëndroni të identifikuar. Këto cookie nuk mund të çaktivizohen pa humbur funksionalitetin e hyrjes.</p>

          <h2>4. Si t'i Kontrolloni Cookie-t</h2>
          <p>Mund të menaxhoni cookie-t përmes cilësimeve të browser-it tuaj:</p>
          <ul>
            <li><strong>Chrome:</strong> Cilësimet → Privatësia → Cookie-t</li>
            <li><strong>Firefox:</strong> Cilësimet → Privatësia → Menaxho Cookie-t</li>
            <li><strong>Safari:</strong> Preferencat → Privatësia</li>
            <li><strong>Edge:</strong> Cilësimet → Cookie-t dhe lejet e faqes</li>
          </ul>
          <p>Fshirja e cookie-ve të sesionit do t'ju çidentifikojë nga platforma.</p>

          <h2>5. Ndryshimet</h2>
          <p>Çdo ndryshim i kësaj politike do të publikohet në këtë faqe. Data e përditësimit do të ndryshohet.</p>

          <h2>6. Kontakti</h2>
          <p>Pyetje rreth cookie-ve: <strong>info@alpazar.al</strong></p>
        </div>
        <div className="ftr">
          <a href="/kushtet" style={LS}>Kushtet</a>
          <a href="/privatesia" style={LS}>Privatësia</a>
          <a href="/rreth-nesh" style={LS}>Rreth Nesh</a>
          <a href="/kontakt" style={LS}>Kontakt</a>
          <a href="/siguria" style={LS}>Siguria</a>
          <a href="/" style={LS}>← Kreu</a>
        </div>
      </div>
    </>
  )
}
