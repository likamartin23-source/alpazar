const LS = { color: '#666' as const, fontSize: 11, textDecoration: 'none' as const }

export default function Privatesia() {
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
    .note{background:#EEF4FF;border-left:3px solid #185FA5;padding:10px 14px;border-radius:0 8px 8px 0;margin:12px 0;font-size:12px;color:#185FA5;line-height:1.7;}
    .right-box{background:#EAF3DE;border:0.5px solid #97C459;border-radius:10px;padding:12px 16px;margin:12px 0;}
    .right-box strong{font-size:12px;font-weight:700;color:#3B6D11;display:block;margin-bottom:6px;}
    .right-box ul{color:#3B6D11;font-size:12px;margin:0;}
    .law{font-size:11px;color:#aaa;font-style:italic;}
    .ftr{display:flex;flex-wrap:wrap;gap:8px 16px;padding:20px;background:#f9f9f9;border-top:1px solid #eee;margin-top:10px;}
    .ftr a{color:#888;font-size:11px;text-decoration:none;}
  `
  return (
    <>
      <style>{css}</style>
      <div className="wrap">
        <div className="topbar">
          <a href="/" className="back"><i className="ti ti-arrow-left" /></a>
          <span className="topbar-title">Politika e Privatësisë</span>
        </div>
        <div className="content">
          <h1>Politika e Privatësisë</h1>
          <div className="ver">Versioni 1.0 · Janar 2025 · Ligji Nr. 9887/2008</div>

          <div className="note">
            Alpazar angazhohet për mbrojtjen e privatësisë suaj në përputhje të plotë me Ligjin Nr. 9887/2008 "Për mbrojtjen e të dhënave personale" të Republikës së Shqipërisë dhe Rregulloren GDPR të Bashkimit Europian.
          </div>

          <h2>1. Kontrollori i të Dhënave</h2>
          <p>Kontrolluesi i të dhënave personale është <strong>Alpazar</strong>, me seli në Tiranë, Shqipëri. Kontakt: info@alpazar.al</p>

          <h2>2. Të Dhënat që Mbledhim</h2>
          <p><strong>Të dhëna që jepni direkt:</strong></p>
          <ul>
            <li>Adresa e emailit (për regjistrim dhe hyrje)</li>
            <li>Emri, username dhe qyteti (opsionale, në profil)</li>
            <li>Fotografitë e shpalljeve dhe përshkrimet</li>
            <li>Mesazhet mes përdoruesve</li>
            <li>Informacioni i pagesës për abonim Premium (metodë pagese, jo kartë bankare)</li>
          </ul>
          <p><strong>Të dhëna teknike (automatike):</strong></p>
          <ul>
            <li>Adresa IP dhe browser i përdorur</li>
            <li>Koha dhe frekuenca e vizitave</li>
            <li>Shpalljet e shikuara (numërim anonimik)</li>
            <li>Cookie-t teknike (shih Politikën e Cookie-ve)</li>
          </ul>

          <h2>3. Qëllimi i Përpunimit</h2>
          <ul>
            <li><strong>Ekzekutimi i shërbimit:</strong> autentikimi, menaxhimi i llogarisë, shpalljeve dhe mesazheve</li>
            <li><strong>Siguria:</strong> parandalimi i mashtrimeve dhe abuzimeve</li>
            <li><strong>Pagesa Premium:</strong> konfirmimi dhe menaxhimi i abonimeve</li>
            <li><strong>Statistikat:</strong> numërimi anonim për përmirësimin e platformës</li>
          </ul>
          <p className="law">Baza ligjore: Neni 5 i Ligjit Nr. 9887/2008 — Konsentimi + Ekzekutimi i kontratës</p>

          <h2>4. Ruajtja dhe Siguria</h2>
          <p>Të dhënat tuaja ruhen në serverë të sigurt (Supabase, me hosting në Europë). Ne zbatojmë masat teknike dhe organizative të sigurisë sipas standardeve të industrisë, duke përfshirë enkriptimin SSL/TLS dhe kontrollin e aksesit me role.</p>
          <p>Fjalëkalimet ruhen të hashuara (bcrypt) — asnjëherë në tekst të qartë. Alpazar nuk ka akses në fjalëkalimet tuaja.</p>

          <h2>5. Ndarja me Palë të Treta</h2>
          <p>Alpazar <strong>nuk shet</strong> dhe <strong>nuk tregton</strong> të dhënat tuaja personale. Të dhënat mund t'u aksesohen vetëm:</p>
          <ul>
            <li>Ofruesve të shërbimeve teknike (Supabase, Vercel) — vetëm aq sa nevojitet për funksionimin</li>
            <li>Autoriteteve kompetente shqiptare kur kërkohet me ligj</li>
          </ul>

          <h2>6. Ruajtja në Kohë</h2>
          <ul>
            <li>Të dhënat e llogarisë: deri sa të fshini llogarinë</li>
            <li>Mesazhet: 12 muaj pas shkëmbimit</li>
            <li>Shpalljet e fshira: 30 ditë (kopje rezervë) pastaj fshihen</li>
            <li>Të dhënat teknike/log: 90 ditë</li>
          </ul>

          <h2>7. Të Drejtat Tuaja</h2>
          <div className="right-box">
            <strong>Sipas Ligjit Nr. 9887/2008 dhe GDPR, keni të drejtë të:</strong>
            <ul>
              <li>Aksesoni të dhënat tuaja personale</li>
              <li>Korrigjoni të dhëna të pasakta</li>
              <li>Kërkoni fshirjen e të dhënave (e drejta për t'u harruar)</li>
              <li>Kufizoni përpunimin</li>
              <li>Merrni të dhënat tuaja në format të lexueshëm (portabilitet)</li>
              <li>Kundërshtoni përpunimin</li>
              <li>Tërhiqni konsentimin në çdo kohë</li>
            </ul>
          </div>
          <p>Për ushtrimin e këtyre të drejtave kontaktoni: <strong>info@alpazar.al</strong></p>
          <p>Nëse nuk jeni të kënaqur me përgjigjen, mund të ankoheni te Komisioneri për Mbrojtjen e të Dhënave Personale: <strong>www.idp.al</strong></p>

          <h2>8. Transferimi Ndërkombëtar</h2>
          <p>Të dhënat mund të përpunohen jashtë Shqipërisë (serverët e Supabase dhe Vercel në Bashkimin Europian). Kjo bëhet me mbrojtje adekuate sipas standardeve GDPR.</p>

          <h2>9. Ndryshimet e Politikës</h2>
          <p>Çdo ndryshim i rëndësishëm i kësaj politike do të njoftohet me email ose njoftim në platformë, të paktën 14 ditë para hyrjes në fuqi.</p>

          <h2>10. Kontakti</h2>
          <p>Për çdo pyetje rreth privatësisë: <strong>info@alpazar.al</strong><br/>Alpazar · Tiranë, Shqipëri</p>
        </div>
        <div className="ftr">
          <a href="/kushtet" style={LS}>Kushtet</a>
          <a href="/cookies" style={LS}>Cookie-t</a>
          <a href="/rreth-nesh" style={LS}>Rreth Nesh</a>
          <a href="/kontakt" style={LS}>Kontakt</a>
          <a href="/siguria" style={LS}>Siguria</a>
          <a href="/" style={LS}>← Kreu</a>
        </div>
      </div>
    </>
  )
}
