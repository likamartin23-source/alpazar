const LS = { color: '#666' as const, fontSize: 11, textDecoration: 'none' as const }

export default function Privatesia() {
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
    .note{background:#EEF4FF;border-left:3px solid #185FA5;padding:10px 14px;border-radius:0 8px 8px 0;margin:12px 0;font-size:12px;color:#185FA5;line-height:1.7;}
    .right-box{background:#EAF3DE;border:0.5px solid #97C459;border-radius:10px;padding:12px 16px;margin:12px 0;}
    .right-box strong{font-size:12px;font-weight:700;color:#3B6D11;display:block;margin-bottom:6px;}
    .right-box ul{color:#3B6D11;font-size:12px;margin:0;}
    .law{font-size:11px;color:#555;font-style:italic;}
    .table-wrap{overflow-x:auto;margin:10px 0;}
    table{width:100%;border-collapse:collapse;font-size:12px;}
    th{background:#FFFBEA;padding:8px 10px;text-align:left;font-weight:700;color:#111;border:1px solid #eee;}
    td{padding:8px 10px;color:#444;border:1px solid #eee;vertical-align:top;}
    .ftr{display:flex;flex-wrap:wrap;gap:8px 16px;padding:20px;background:#f9f9f9;border-top:1px solid #eee;margin-top:10px;}
    .ftr a{color:#555;font-size:11px;text-decoration:none;}
  `
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="wrap">
        <div className="topbar">
          <a href="/" className="back" aria-label="Kthehu mbrapa"><i className="ti ti-arrow-left" aria-hidden="true" /></a>
          <span className="topbar-title">Politika e Privatësisë</span>
        </div>
        <div className="content">
          <h1>Politika e Privatësisë</h1>
          <div className="ver">Versioni 2.0 · Përditësuar: Qershor 2026 · Ligji Nr. 124/2024 · Art. 13 GDPR</div>

          <div className="note">
            <strong>Informacion i detyrueshëm sipas Nenit 13 të GDPR dhe Ligjit Nr. 124/2024</strong><br />
            Alpazar angazhohet për mbrojtjen e privatësisë suaj në përputhje të plotë me Ligjin Nr. 124/2024 "Për mbrojtjen e të dhënave personale" (harmonizuar me GDPR 2016/679) dhe legjislacionin shqiptar në fuqi.
          </div>

          <h2>1. Identiteti dhe Kontakti i Kontrolluesit</h2>
          <p><strong>Kontrolluesi i të dhënave:</strong> Alpazar<br />
          <strong>Adresa:</strong> Tiranë, Shqipëri<br />
          <strong>Email kontakti (DPO/Privatësi):</strong> alpazarsuport@gmail.com<br />
          <strong>Email i përgjithshëm:</strong> alpazarsuport@gmail.com</p>

          <h2>2. Kategoritë e të Dhënave dhe Qëllimi i Përpunimit</h2>
          <p>Përpunojmë kategorinë minimale të nevojshme të të dhënave personale. Tabela më poshtë shpjegon çdo kategori, qëllimin dhe bazën ligjore:</p>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Kategoria</th>
                  <th scope="col">Të dhënat</th>
                  <th scope="col">Qëllimi</th>
                  <th scope="col">Baza ligjore</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Identifikimi</strong></td>
                  <td>Email, numër telefoni, username</td>
                  <td>Autentikimi dhe menaxhimi i llogarisë</td>
                  <td>Ekzekutimi i kontratës (Art. 6.1.b)</td>
                </tr>
                <tr>
                  <td><strong>Profili</strong></td>
                  <td>Emri, qyteti, fotografia e profilit (opsionale)</td>
                  <td>Personalizimi i eksperiencës</td>
                  <td>Konsentimi (Art. 6.1.a)</td>
                </tr>
                <tr>
                  <td><strong>Shpalljet</strong></td>
                  <td>Titull, përshkrim, çmim, fotografi, lokacion</td>
                  <td>Publikimi dhe shfaqja e shpalljeve</td>
                  <td>Ekzekutimi i kontratës (Art. 6.1.b)</td>
                </tr>
                <tr>
                  <td><strong>Komunikimet</strong></td>
                  <td>Mesazhet ndërmjet përdoruesve</td>
                  <td>Shërbimi i mesazheve</td>
                  <td>Ekzekutimi i kontratës (Art. 6.1.b)</td>
                </tr>
                <tr>
                  <td><strong>Teknikë</strong></td>
                  <td>IP, browser, kohëzgjatja e sesionit</td>
                  <td>Siguria, antifraud, debugging</td>
                  <td>Interesi legjitim (Art. 6.1.f)</td>
                </tr>
                <tr>
                  <td><strong>Pagesa Premium</strong></td>
                  <td>Konfirmimi i pagesës (jo kartë bankare)</td>
                  <td>Aktivizimi i abonimit Premium</td>
                  <td>Ekzekutimi i kontratës (Art. 6.1.b)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="law">Nuk përpunojmë kategori speciale të dhënash (Art. 9 GDPR) dhe nuk marrim vendime të automatizuara me efekte juridike (Art. 22 GDPR).</p>

          <h2>3. Ruajtja dhe Siguria Teknike</h2>
          <p>Të dhënat ruhen në infrastrukturën e <strong>Supabase</strong> (me datacenter në Europë — Frankfurt, Gjermani) dhe <strong>Vercel</strong> (me CDN në Europë). Të dyja kompanite janë të certifikuara SOC 2 Type II.</p>
          <p>Masat teknike dhe organizative të sigurisë përfshijnë:</p>
          <ul>
            <li>Enkriptim TLS 1.3 për të gjitha lidhjet</li>
            <li>Enkriptim AES-256 për të dhënat në pushim (at rest)</li>
            <li>Fjalëkalimet ruhen me hash bcrypt (nuk janë kurrë të lexueshme)</li>
            <li>Row-Level Security (RLS) — çdo përdorues sheh vetëm të dhënat e veta</li>
            <li>Autentikimi me OTP SMS me skadim 120 sekondash</li>
            <li>Auditim i plota i akseseve administrative (MFA i detyrueshëm)</li>
          </ul>

          <h2>4. Periudhat e Ruajtjes</h2>
          <ul>
            <li><strong>Të dhënat e llogarisë:</strong> deri sa të kërkoni fshirjen</li>
            <li><strong>Shpalljet aktive:</strong> deri sa të fshihen nga përdoruesi ose të skadojnë</li>
            <li><strong>Shpalljet e fshira:</strong> 30 ditë kopje rezervë, pastaj fshihen përfundimisht</li>
            <li><strong>Mesazhet:</strong> 12 muaj pas mesazhit të fundit</li>
            <li><strong>Loget teknike (IP, sesionet):</strong> 90 ditë</li>
            <li><strong>Të dhënat e transaksioneve Premium:</strong> 5 vjet (detyrim ligjor fiskal)</li>
          </ul>

          <h2>5. Ndarja me Palë të Treta</h2>
          <p>Alpazar <strong>nuk shet dhe nuk tregton</strong> të dhënat tuaja. Aksesi i kufizuar lejohet vetëm tek:</p>
          <ul>
            <li><strong>Supabase Inc.</strong> — ruajtja e bazës së të dhënave dhe autentikimi (Data Processing Agreement aktiv)</li>
            <li><strong>Vercel Inc.</strong> — infrastruktura e hosting-ut (DPA aktiv)</li>
            <li><strong>Vercel Analytics</strong> — statistika anonime të vizitorëve (pa cookies, GDPR-compliant)</li>
            <li><strong>Autoritetet kompetente shqiptare</strong> — vetëm me urdhër gjykate ose kërkesë ligjore</li>
          </ul>

          <h2>6. Transferimi Ndërkombëtar</h2>
          <p>Të dhënat përpunohen brenda Bashkimit Europian (Frankfurt, Gjermani). Nëse bëhet transferim jashtë BE-së, ai realizohet me <strong>Klauzolat Standarde Kontraktuale (SCCs)</strong> të miratuara nga Komisioni Europian, sipas Nenit 46 të GDPR.</p>

          <h2>7. Të Drejtat Tuaja</h2>
          <div className="right-box">
            <strong>Sipas Ligjit Nr. 124/2024 dhe GDPR (Nenet 15-22), keni të drejtë të:</strong>
            <ul>
              <li><strong>Aksesoni</strong> — merrni kopje të të dhënave tuaja personale (Art. 15)</li>
              <li><strong>Korrigjoni</strong> — ndryshoni të dhëna të pasakta (Art. 16)</li>
              <li><strong>Fshini</strong> — "e drejta për t'u harruar" (Art. 17)</li>
              <li><strong>Kufizoni</strong> — pezulloni përkohësisht përpunimin (Art. 18)</li>
              <li><strong>Portabilizoni</strong> — merrni të dhënat në format të lexueshëm makinë (Art. 20)</li>
              <li><strong>Kundërshtoni</strong> — ndaloni përpunimin bazuar mbi interes legjitim (Art. 21)</li>
              <li><strong>Tërhiqni konsentimin</strong> — pa pasoja negative, në çdo kohë (Art. 7.3)</li>
            </ul>
          </div>
          <p>Ushtroni të drejtat tuaja duke dërguar email tek <strong>alpazarsuport@gmail.com</strong> me subjekt "Kërkesë Privatësi". Përgjigjet jepen brenda <strong>30 ditëve</strong> (ose 90 ditë nëse kompleksiteti e kërkon, me njoftim).</p>
          <p>Nëse nuk jeni të kënaqur me përgjigjen, keni të drejtë të paraqisni ankesë tek:</p>
          <p className="law"><strong>Komisioneri për Mbrojtjen e të Dhënave Personale (IDP)</strong><br />
          Adresa: Rruga "Abdi Toptani", Nr. 2, Tiranë · Tel: +355 4 2235996 · www.idp.al</p>

          <h2>8. Cookie-t dhe Teknologjitë e Gjurmimit</h2>
          <p>Alpazar përdor vetëm cookie-t teknikë të domosdoshëm për funksionimin e platformës (autentikimi, preferencat). Nuk përdorim cookie-t e marketingut apo ata të palëve të treta pa konsentimin tuaj.</p>
          <p>Për detaje të plota, lexoni <a href="/cookies" style={{ color: '#C42B0F' }}>Politikën e Cookie-ve</a>.</p>

          <h2>9. Ndryshimet e Politikës</h2>
          <p>Çdo ndryshim i rëndësishëm i kësaj politike njoftohet me email dhe njoftim në platformë, të paktën <strong>14 ditë</strong> para hyrjes në fuqi, sipas Nenit 13.2 të GDPR. Data e përditësimit shfaqet gjithmonë në krye të faqes.</p>

          <h2>10. Kontakti për Privatësinë</h2>
          <p>
            <strong>Email privatësi (DPO):</strong> alpazarsuport@gmail.com<br />
            <strong>Email i përgjithshëm:</strong> alpazarsuport@gmail.com<br />
            <strong>Adresa:</strong> Alpazar · Tiranë, Shqipëri
          </p>
        </div>
        <div className="ftr">
          <a href="/kushtet" style={LS}>Kushtet</a>
          <a href="/cookies" style={LS}>Cookie-t</a>
          <a href="/takedown" style={LS}>Heqja e Përmbajtjes</a>
          <a href="/rreth-nesh" style={LS}>Rreth Nesh</a>
          <a href="/kontakt" style={LS}>Kontakt</a>
          <a href="/" style={LS}>← Kreu</a>
        </div>
      </div>
    </>
  )
}
