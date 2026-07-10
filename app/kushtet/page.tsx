const LS = { color: '#666' as const, fontSize: 11, textDecoration: 'none' as const }

export default function Kushtet() {
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
    .note{background:#FFFBEA;border-left:3px solid #E63312;padding:10px 14px;border-radius:0 8px 8px 0;margin:12px 0;font-size:12px;color:#555;line-height:1.7;}
    .law{font-size:11px;color:#aaa;font-style:italic;}
    .ftr{display:flex;flex-wrap:wrap;gap:8px 16px;padding:20px;background:#f9f9f9;border-top:1px solid #eee;margin-top:10px;}
    .ftr a{color:#888;font-size:11px;text-decoration:none;}
  `
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="wrap">
        <div className="topbar">
          <a href="/" className="back" aria-label="Kthehu mbrapa"><i className="ti ti-arrow-left" aria-hidden="true" /></a>
          <span className="topbar-title">Kushtet e Përdorimit</span>
        </div>
        <div className="content">
          <h1>Kushtet e Përdorimit</h1>
          <div className="ver">Versioni 2.0 · Përditësuar: Qershor 2026 · Ligji Nr. 124/2024</div>

          <h2>1. Pranimi i Kushteve</h2>
          <p>Duke aksesuar dhe përdorur platformën Alpazar, ju pranoni plotësisht dhe pa rezerva kushtet e mëposhtme. Nëse nuk pranoni, ju lutem mos e përdorni shërbimin. Alpazar rezervon të drejtën të ndryshojë këto kushte me njoftim paraprak 30-ditor.</p>

          <h2>2. Rreth Alpazar</h2>
          <p>Alpazar është platformë shqiptare e tregtisë elektronike ndërmjet individëve dhe bizneseve (C2C dhe B2C). Platforma ofron shërbime bazë falas dhe opsione premium me pagesë. Alpazar vepron si ndërmjetës teknik — nuk është palë në transaksionet mes përdoruesve dhe nuk garanton produktet e listuara.</p>
          <div className="note">Alpazar nuk garanton saktësinë e shpalljeve dhe nuk mban përgjegjësi direkte për transaksionet mes palëve. Secili përdorues vepron nën përgjegjësinë e tij.</div>

          <h2>3. Kushtet e Regjistrimit</h2>
          <ul>
            <li>Mosha minimale: <strong>16 vjeç</strong> (konfirmuar me Age Gate)</li>
            <li>Informacioni i dhënë duhet të jetë i saktë, i plotë dhe i vërtetë</li>
            <li>Secili person mund të ketë vetëm një llogari aktive</li>
            <li>Jeni plotësisht përgjegjës për ruajtjen e kredencialeve tuaja</li>
            <li>Ndalohet ndarja ose transferimi i llogarisë tek persona të tjerë</li>
            <li>Alpazar rezervon të drejtën të pezullojë ose fshijë llogarinë pa njoftim paraprak në rast shkeljes</li>
          </ul>

          <h2>4. Rregullat e Shpalljeve</h2>
          <p>Çdo shpallje duhet të përmbajë informacion të saktë, fotografi origjinale dhe çmim real. Shpalljet duhet të kategorizohen saktë. Ndalohen shpalljet mashtruese, shpalljet për produkte/shërbime të ndaluara, kopjet e shpalljeve dhe shpalljet me qëllim reklamimi masiv.</p>
          <p>Alpazar rezervon të drejtën të fshijë çdo shpallje që shkel rregullat pa njoftim paraprak.</p>

          <h2>5. Artikujt dhe Shërbimet e Ndaluara</h2>
          <ul>
            <li>Armë, municion dhe pajisje ushtarake pa leje ligjore (Ligji Nr. 9/2018)</li>
            <li>Substanca narkotike dhe psikotropike (Ligji Nr. 7975/1995 dhe ndryshimet)</li>
            <li>Material pornografik, sidomos ai me të mitur (Neni 117, Kodi Penal)</li>
            <li>Kafshë të mbrojtura të specieve të rrezikuara (CITES)</li>
            <li>Produkte të falsifikuara, të vjedhura ose me origjinë të dyshimtë</li>
            <li>Piramida financiare, skema Ponzi dhe investime mashtruese</li>
            <li>Shërbime mashtruese ose shërbime me natyrë seksuale</li>
            <li>Çdo artikull ose shërbim i ndaluar me ligjet e Republikës së Shqipërisë</li>
          </ul>
          <div className="note">Raportimi i shpalljeve të dyshimta bëhet me butonin "Raporto" ose me email tek support@alpazar.al. Shpalljet ilegale i raportohen autoriteteve kompetente.</div>

          <h2>5-a. Mbrojtja e Fëmijëve dhe Raportimi i Shkeljeve</h2>
          <p>Alpazar zbaton tolerancë zero ndaj çdo përmbajtjeje që dëmton ose shfrytëzon fëmijët:</p>
          <ul>
            <li>Çdo material seksual që përfshin të mitur <span className="law">(Kodi Penal, neni 117)</span> raportohet <strong>MENJËHERË</strong> te Policia e Shtetit dhe prokuroria kompetente — dhe hiqet pa paralajmërim.</li>
            <li>Moshat nën 16 vjeç nuk mund të regjistrohen <span className="law">(Ligji 124/2024, neni 8)</span>.</li>
            <li>Nuk lejohet asnjë kontakt privat i rritur–fëmijë brenda platformës.</li>
            <li>Çdo shpallje ose aktivitet i dyshimtë raportohet me butonin <span aria-hidden="true">⚠️</span> ose nëpërmjet <a href="/takedown" style={{ color: '#E63312' }}>/takedown</a>.</li>
          </ul>
          <div className="note">Shkeljet penale raportohen edhe pa kërkesën e viktimës. Platforma bashkëpunon plotësisht me autoritetet hetimore.</div>

          <h2>6. Shërbimi Premium</h2>
          <p>Shërbimi Premium ofrohet me tarifa mujore ose vjetore të publikuara në platformë. Pagesa konfirmohet brenda 24 orësh pune. Anulimi bëhet duke kontaktuar administratorët. Rimbursimi nuk ofrohet për periudha të shfrytëzuara plotësisht, por mund të merret parasysh rast pas rasti sipas ligjit të konsumatorëve (Ligji Nr. 9902/2008, Neni 35).</p>

          <h2>7. Mbrojtja e të Dhënave Personale</h2>
          <p>Mbledhja, ruajtja dhe përpunimi i të dhënave personale kryhet në përputhje me <strong>Ligjin Nr. 124/2024 "Për mbrojtjen e të dhënave personale"</strong> (hyrë në fuqi 1 Janar 2025), i cili harmonizoi legjislacionin shqiptar me Rregulloren GDPR 2016/679 të BE-së.</p>
          <p>Për detaje të plota, shihni <a href="/privatesia" style={{ color: '#E63312' }}>Politikën e Privatësisë</a> dhe <a href="/cookies" style={{ color: '#E63312' }}>Politikën e Cookie-ve</a>.</p>
          <p className="law">Autoritet mbikëqyrëse: Komisioneri për Mbrojtjen e të Dhënave Personale — www.idp.al</p>

          <h2>8. Heqja dhe Notice-and-Takedown</h2>
          <p>Nëse besoni se një shpallje shkel të drejtat tuaja të autorit, privatësinë ose është ilegale, mund të paraqisni kërkesë formale <a href="/takedown" style={{ color: '#E63312' }}>këtu</a>. Alpazar shqyrton çdo kërkesë brenda 72 orëve pune dhe vepron sipas Ligjit Nr. 9880/2008 "Për nënshkrimin elektronik" dhe direktivave europiane mbi tregtinë elektronike.</p>

          <h2>9. Kufizimi i Përgjegjësisë</h2>
          <p>Alpazar nuk mban përgjegjësi për: saktësinë e informacionit të postuar nga përdoruesit; humbjet financiare nga transaksionet mes palëve; dëmet e shkaktuara nga ndërprerjet teknike; apo veprimet e palëve të treta. Limiti maksimal i përgjegjësisë së Alpazar ndaj çdo përdoruesi është i barabartë me shumën e paguar prej tij gjatë 12 muajve të fundit.</p>

          <h2>10. Pronësia Intelektuale</h2>
          <p>E gjithë platforma Alpazar — logo, dizajni, kodi burimor dhe brendi — mbrohet me <strong>Ligjin Nr. 35/2016 "Për të Drejtat e Autorit dhe të Drejtat e Tjera të Lidhura me To"</strong> dhe Ligjin Nr. 52/2025 "Për markat tregtare dhe treguesit gjeografikë". Çdo riprodhim, kopjim ose shpërndarje pa autorizim të shkruar është i ndaluar rreptësisht.</p>
          <p>Përdoruesit mbajnë të drejtën e autorit mbi fotografitë dhe përshkrimet e tyre, por japin Alpazar licencë jo-ekskluzive për t'i shfaqur ato brenda platformës.</p>

          <h2>11. Ligji i Aplikueshëm dhe Juridiksioni</h2>
          <p>Këto kushte rregullohen ekskluzivisht nga legjislacioni i Republikës së Shqipërisë. Çdo mosmarrëveshje paraqitet fillimisht tek procedura e zgjidhjes alternative të mosmarrëveshjeve (ODR), dhe nëse nuk zgjidhet brenda 30 ditëve, i paraqitet Gjykatës së Rrethit Gjyqësor Tiranë (juridiksioni i përgjithshëm).</p>

          <h2>12. Ndryshimet e Kushteve</h2>
          <p>Alpazar njofton ndryshimet e rëndësishme të kushteve të paktën 30 ditë para hyrjes në fuqi, me email dhe njoftim brenda platformës. Vazhdimi i përdorimit pas datës efektive nënkupton pranimin e plotë të kushteve të reja.</p>

          <h2>13. Kontakti Ligjor</h2>
          <p>Pyetje ligjore dhe ankesa: <strong>support@alpazar.al</strong><br />Alpazar · Tiranë, Shqipëri</p>
        </div>
        <div className="ftr">
          <a href="/privatesia" style={LS}>Privatësia</a>
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
