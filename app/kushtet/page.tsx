const LS = { color: '#666' as const, fontSize: 11, textDecoration: 'none' as const }

export default function Kushtet() {
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
    .note{background:#FFFBEA;border-left:3px solid #E63312;padding:10px 14px;border-radius:0 8px 8px 0;margin:12px 0;font-size:12px;color:#555;line-height:1.7;}
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
          <span className="topbar-title">Kushtet e Përdorimit</span>
        </div>
        <div className="content">
          <h1>Kushtet e Përdorimit</h1>
          <div className="ver">Versioni 1.0 · Janar 2025 · Ligji shqiptar i zbatueshëm</div>

          <h2>1. Pranimi i Kushteve</h2>
          <p>Duke aksesuar dhe përdorur platformën Alpazar, ju pranoni plotësisht dhe pa rezerva kushtet e mëposhtme. Nëse nuk pranoni, ju lutem mos e përdorni shërbimin.</p>

          <h2>2. Rreth Alpazar</h2>
          <p>Alpazar është platformë shqiptare e tregtisë elektronike mes individëve dhe bizneseve. Platforma ofron shërbime falas dhe opsionale premium. Alpazar nuk është palë në transaksione — ofron vetëm hapësirën e komunikimit.</p>
          <div className="note">Alpazar nuk garanton saktësinë e shpalljeve dhe nuk mban përgjegjësi për transaksionet mes përdoruesve.</div>

          <h2>3. Regjistrimi dhe Llogaria</h2>
          <ul>
            <li>Minimumi i moshës: 16 vjeç për regjistrim</li>
            <li>Duhet të jepni informacion të saktë dhe të vërtetë</li>
            <li>Jeni plotësisht përgjegjës për ruajtjen e fjalëkalimit</li>
            <li>Çdo llogari është personale dhe jo e transferueshme</li>
            <li>Alpazar rezervon të drejtën të pezullojë ose fshijë llogarinë në rast shkeljes</li>
          </ul>

          <h2>4. Rregullat e Shpalljeve</h2>
          <p>Çdo shpallje duhet të përmbajë informacion të saktë dhe fotografi origjinale. Çmimi duhet të jetë real. Shpallja duhet të kategorizohet saktë. Ndalohet publikimi i shpalljeve për produkte apo shërbime të ndaluara me ligj.</p>

          <h2>5. Artikujt e Ndaluara</h2>
          <ul>
            <li>Armë dhe municion pa leje ligjore (L. Nr. 9/2018)</li>
            <li>Substanca narkotike dhe psikotropike (L. Nr. 7975/1995)</li>
            <li>Material pornografik, veçanërisht me të mitur</li>
            <li>Kafshë të mbrojtura dhe të rralla pa leje</li>
            <li>Produkte të falsifikuara ose të vjedhura</li>
            <li>Piramida financiare dhe skema mashtruese</li>
            <li>Çdo artikull i ndaluar me ligjet e Republikës së Shqipërisë</li>
          </ul>

          <h2>6. Shërbimi Premium</h2>
          <p>Shërbimi Premium ofrohet me pagesë mujore (9.99€) ose vjetore (95.88€). Pagesa procesohet manualisht brenda 24 orësh. Rimbursimi nuk ofrohet për periudha të utilizuara. Anulimi mund të bëhet çdo kohë duke kontaktuar administratorët.</p>

          <h2>7. Mbrojtja e të Dhënave</h2>
          <p>Mbledhja dhe përpunimi i të dhënave personale kryhet në përputhje me Ligjin Nr. 9887/2008 "Për mbrojtjen e të dhënave personale" dhe ndryshimet e Ligjit Nr. 48/2012.</p>
          <p className="law">Komisioneri për Mbrojtjen e të Dhënave Personale: www.idp.al</p>

          <h2>8. Kufizimi i Përgjegjësisë</h2>
          <p>Alpazar nuk mban përgjegjësi për saktësinë e informacionit të postuar nga përdoruesit, për transaksionet mes palëve, për humbjet financiare, apo për ndërprerjet teknike.</p>

          <h2>9. Pronësia Intelektuale</h2>
          <p>E gjithë platforma Alpazar — logo, dizajn, kod — mbrohet me Ligjin Nr. 35/2016 për të Drejtat e Autorit. Kopjimi i paautorizuar është i ndaluar rreptësisht.</p>

          <h2>10. Ligji dhe Juridiksioni</h2>
          <p>Këto kushte rregullohen nga legjislacioni i Republikës së Shqipërisë. Çdo mosmarrëveshje i paraqitet gjykatave kompetente me seli në Tiranë.</p>

          <h2>11. Ndryshimet</h2>
          <p>Alpazar rezervon të drejtën të ndryshojë këto kushte. Ndryshimet njoftohen 30 ditë para hyrjes në fuqi. Vazhdimi i përdorimit nënkupton pranimin e kushteve të reja.</p>

          <h2>12. Kontakti</h2>
          <p>Pyetje ligjore: <strong>likamartin23@gmail.com</strong> · Alpazar, Tiranë, Shqipëri</p>
        </div>
        <div className="ftr">
          <a href="/privatesia" style={LS}>Privatësia</a>
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
