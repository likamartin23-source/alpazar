const LS = { color: '#666' as const, fontSize: 11, textDecoration: 'none' as const }

export default function Cookies() {
  const css = `
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
    .wrap{max-width:640px;margin:0 auto;background:#fff;min-height:100vh;}
    .topbar{background:linear-gradient(165deg,#F8D24E 0%,#F5C842 52%,#EEB828 100%);padding:10px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
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
    .note{background:#FFFBEA;border-left:3px solid #F5C842;padding:10px 14px;border-radius:0 8px 8px 0;margin:12px 0;font-size:12px;color:#666;line-height:1.7;}
    .cookie-card{background:#f9f9f9;border:1px solid #eee;border-radius:10px;padding:12px 16px;margin:8px 0;}
    .cookie-card strong{font-size:12px;font-weight:700;color:#111;display:block;margin-bottom:4px;}
    .cookie-card span{font-size:11px;color:#666;}
    .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;margin-left:6px;}
    .badge-req{background:#EAF3DE;color:#3B6D11;}
    .badge-opt{background:#EEF4FF;color:#185FA5;}
    .law{font-size:11px;color:#555;font-style:italic;}
    .table-wrap{overflow-x:auto;margin:10px 0;}
    table{width:100%;border-collapse:collapse;font-size:12px;}
    th{background:#FFFBEA;padding:8px 10px;text-align:left;font-weight:700;color:#111;border:1px solid #eee;}
    td{padding:8px 10px;color:#444;border:1px solid #eee;vertical-align:top;}
    code{background:#f0f0f0;padding:1px 5px;border-radius:3px;font-size:11px;font-family:monospace;}
    .ftr{display:flex;flex-wrap:wrap;gap:8px 16px;padding:20px;background:#f9f9f9;border-top:1px solid #eee;margin-top:10px;}
    .ftr a{color:#555;font-size:11px;text-decoration:none;}
  `
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="wrap">
        <div className="topbar">
          <a href="/" className="back" aria-label="Kthehu mbrapa"><i className="ti ti-arrow-left" aria-hidden="true" /></a>
          <span className="topbar-title">Politika e Cookie-ve</span>
        </div>
        <div className="content">
          <h1>Politika e Cookie-ve</h1>
          <div className="ver">Versioni 2.0 · Përditësuar: Qershor 2026 · Ligji Nr. 124/2024 · Ligji Nr. 54/2024 Art. 158/6</div>

          <div className="note">
            Kjo politikë shpjegon se si Alpazar përdor cookie-t dhe teknologjitë e ngjashme, në përputhje me <strong>Ligjin Nr. 124/2024</strong> "Për mbrojtjen e të dhënave personale" dhe <strong>Ligjin Nr. 54/2024</strong> (Neni 158/6 — transpozimi shqiptar i Direktivës ePrivacy 2002/58/EC) që kërkon konsentim paraprak për cookie-t jo-thelbësorë.
          </div>

          <h2>1. Çfarë janë Cookie-t?</h2>
          <p>Cookie-t janë skedarë të vegjël tekst që një faqe web ruan në pajisjen tuaj kur e vizitoni. Ato mundësojnë mbajtjen e gjendjes gjatë sesionit (p.sh. të qenit i kyçur), personalizimin e preferencave dhe analizën e trafikut.</p>
          <p>Alpazar përdor edhe teknologji të ngjashme si <strong>localStorage</strong> (p.sh. për konfirmimin e moshës) dhe <strong>sessionStorage</strong> (për gjendjet e sesionit).</p>

          <h2>2. Llojet e Cookie-ve që Përdorim</h2>

          <div className="cookie-card">
            <strong>Cookie Thelbësorë (Strictly Necessary) <span className="badge badge-req">I detyrueshëm</span></strong>
            <span>Këta cookie janë të domosdoshëm për funksionimin bazë të platformës. Nuk kërkohet konsentimi juaj sipas Nenit 158/6 §3, Ligji Nr. 54/2024.</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Emri</th>
                  <th scope="col">Qëllimi</th>
                  <th scope="col">Jetëgjatësia</th>
                  <th scope="col">Ofruesi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>sb-*-auth-token</code></td>
                  <td>Sesioni i autentikimit (Supabase JWT) — mban hyrjen aktive</td>
                  <td>1 orë (rinovohet automatikisht)</td>
                  <td>Supabase / alpazar.al</td>
                </tr>
                <tr>
                  <td><code>alpazar_age_ok</code></td>
                  <td>Konfirmimi i moshës 16+ (localStorage, jo cookie HTTP)</td>
                  <td>Persistent (deri sa fshihet manualisht)</td>
                  <td>alpazar.al</td>
                </tr>
                <tr>
                  <td><code>alpazar_cookie_ok</code></td>
                  <td>Ruajtja e zgjedhjes suaj të konsentimit të cookie-ve</td>
                  <td>365 ditë</td>
                  <td>alpazar.al</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="cookie-card">
            <strong>Cookie Analitikë <span className="badge badge-opt">Pa konsentim të veçantë</span></strong>
            <span>Alpazar përdor Vercel Analytics — sistem analitik <strong>pa cookie</strong>, që mbledh vetëm statistika agregate anonime (pa ruajtje të IP-së individuale, pa fingerprinting, pa identifikim të vizitorit). Sipas Udhëzimit të WP29 dhe EDPB, kjo teknologji nuk kërkon konsentim të veçantë.</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Teknologjia</th>
                  <th scope="col">Qëllimi</th>
                  <th scope="col">Cookie?</th>
                  <th scope="col">Ofruesi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Vercel Analytics</td>
                  <td>Statistika anonime vizitorësh (numri vizitave, faqet populare)</td>
                  <td>Jo — pa cookie</td>
                  <td>Vercel Inc. (USA/EU)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="cookie-card">
            <strong>Cookie Marketingu dhe Reklamimit <span className="badge badge-req">Nuk përdoren</span></strong>
            <span>Alpazar <strong>nuk përdor</strong> asnjë cookie reklamimi, tracker nga palë të treta (Meta Pixel, Google Analytics, TikTok Pixel, Hotjar etj.) dhe nuk ndan të dhëna me platformat reklamuese. Zero re-targeting. Zero profilizim.</span>
          </div>

          <h2>3. Baza Ligjore</h2>
          <p>Cookie-t thelbësorë nuk kërkojnë konsentim bazuar mbi nenin 158/6 §3 të Ligjit Nr. 54/2024 (transpozim i Nenit 5.3 të Direktivës ePrivacy 2002/58/EC), pasi janë të nevojshëm teknikisht për ofrimin e shërbimit të kërkuar shprehimisht nga përdoruesi.</p>
          <p>Nëse në të ardhmen shtohen cookie analitikë ose marketingu, ato do të kërkojnë konsentim paraprak, të lirë, specifik, të informuar dhe të shprehur qartë (Art. 6.1.a GDPR dhe Art. 7 Ligji Nr. 124/2024).</p>
          <p className="law">Ligji Nr. 54/2024 "Për komunikimet elektronike" — Neni 158/6 · Ligji Nr. 124/2024 "Për mbrojtjen e të dhënave personale" · Direktiva ePrivacy 2002/58/EC</p>

          <h2>4. Si t'i Kontrolloni Cookie-t Tuaja</h2>
          <p>Mund të menaxhoni cookie-t nëpërmjet:</p>
          <ul>
            <li><strong>Cilësimet e browser-it tuaj:</strong>
              <ul style={{ marginTop: 6 }}>
                <li>Chrome: Cilësimet → Privatësia dhe Siguria → Cookie-t</li>
                <li>Firefox: Opsionet → Privatësia dhe Siguria → Cookie-t</li>
                <li>Safari: Preferencat → Privatësia</li>
                <li>Edge: Cilësimet → Cookie-t dhe lejet e faqes</li>
              </ul>
            </li>
            <li><strong>Mode Incognito/Private</strong> — cookie-t fshihen automatikisht pas mbylljes së browser-it</li>
            <li><strong>Fshirja manuale e localStorage</strong> — Developer Tools → Application → Local Storage → alpazar.vercel.app</li>
          </ul>
          <p>Nëse bllokoni cookie-t thelbësorë (autentikimi), nuk do të mund të kyçeni në Alpazar. Cookie-t opsionale mund të çaktivizohen pa ndikuar në funksionalitetin kryesor.</p>

          <h2>5. Cookie-t e Palëve të Treta</h2>
          <p>Alpazar nuk integron shërbime të palëve të treta që vendosin cookie-t pa konsentimin tuaj. Lidhjet externe (Facebook, Instagram, TikTok etj.) hapen në browser të veçantë dhe ato platforma kanë politikat e tyre të pavarura të cookie-ve.</p>

          <h2>6. Ndryshimet e Politikës</h2>
          <p>Çdo ndryshim i kësaj politike njoftohet me banner brenda platformës, të paktën 14 ditë para hyrjes në fuqi. Konsentimi i mëparshëm rishikohet nëse kategoritë e cookie-ve ndryshojnë ose shtohen të reja. Data e përditësimit shfaqet gjithmonë në krye të faqes.</p>

          <h2>7. Kontakti dhe Ankesat</h2>
          <p>Pyetje rreth cookie-ve dhe privatësisë:<br />
          <strong>alpazarsuport@gmail.com</strong> · Alpazar, Tiranë, Shqipëri</p>
          <p>Ankesa te autoriteti mbikëqyrës:<br />
          <strong>Komisioneri për Mbrojtjen e të Dhënave Personale</strong><br />
          Rruga "Abdi Toptani", Nr. 2, Tiranë · <strong>www.idp.al</strong></p>
          <p className="law">Të drejtat tuaja sipas Ligjit Nr. 124/2024 dhe GDPR janë të shpjeguara plotësisht në Politikën e Privatësisë.</p>
        </div>
        <div className="ftr">
          <a href="/kushtet" style={LS}>Kushtet</a>
          <a href="/privatesia" style={LS}>Privatësia</a>
          <a href="/rreth-nesh" style={LS}>Rreth Nesh</a>
          <a href="/kontakt" style={LS}>Kontakt</a>
          <a href="/" style={LS}>← Kreu</a>
        </div>
      </div>
    </>
  )
}
