const LS = { color: '#666' as const, fontSize: 'var(--fs-dysheme)', textDecoration: 'none' as const }

export default function Kushtet() {
  const css = `
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:var(--az-cream);}
    .wrap{max-width:var(--kolona-lexim);margin:0 auto;background:#fff;min-height:100vh;}
    .topbar{background:linear-gradient(165deg,var(--az-yellow-hi) 0%,var(--az-yellow) 52%,var(--az-yellow-lo) 100%);padding:10px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
    .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;flex-shrink:0;}
    .back i{font-size:18px;color:#111;}
    .topbar-title{font-size:15px;font-weight:700;color:#111;}
    .content{padding:24px 20px 40px;}
    .ver{font-size:var(--fs-dysheme);color:#6E6E6E;margin-bottom:20px;background:var(--az-cream);padding:8px 12px;border-radius:8px;display:inline-block;}
    h1{font-size:var(--fs-3xl);font-weight:700;color:#111;margin-bottom:8px;}
    h2{font-size:var(--fs-dysheme);font-weight:700;color:#111;margin:22px 0 8px;padding-bottom:5px;border-bottom:2px solid var(--az-yellow);}
    p{font-size:var(--fs-dysheme);color:#444;line-height:1.85;margin-bottom:10px;}
    ul{font-size:var(--fs-dysheme);color:#444;line-height:1.85;padding-left:18px;margin-bottom:10px;}
    li{margin-bottom:5px;}
    .note{background:var(--az-cream);border-left:3px solid var(--az-red);padding:10px 14px;border-radius:0 8px 8px 0;margin:12px 0;font-size:var(--fs-dysheme);color:#555;line-height:1.7;}
    .law{font-size:var(--fs-dysheme);color:#555;font-style:italic;}
    .ftr{display:flex;flex-wrap:wrap;gap:8px 16px;padding:20px;background:#f9f9f9;border-top:1px solid #eee;margin-top:10px;}
    .ftr a{color:#555;font-size:var(--fs-dysheme);text-decoration:none;}

    /* ── MODELI DY-SHTRESOR (urdhër pronari, 5 shtator; PLANI-OPTIK §17/§17.1) ──
       PROTOTIP te /kushtet (rasti më i keq: më parë 29% shfrytëzim @1920, ishull
       teksti 37em mbi krem bosh). Zëvendëson doktrinën e kolonës së ngurtë 37em.

       · Shtresa BAZË = "tavolinë e pastër" (përgjigje e pronarit §17.1): vetëm
         sipërfaqja vizuale e platformës në 100% të ekranit — pa karta, pa
         katalog, pa asnjë të dhënë a komponent. Vetëm që ekrani të mos mbetet
         zbrazëti. Këtu: krem-i i platformës.
       · Shtresa e PËRMBAJTJES = panel me gjerësi proporcionale me vw (kurrë px
         të ngurtë), fletë mbi tavolinë me lartësim (hije + rreze). Kur zgjerohet,
         teksti ndahet në kolona gazete që ekrani të mbushet DHE masa të mbetet
         60-75 karaktere/kolonë — jo shkronjë 40px.
       Mobil-i (<1000px) i PANDRYSHUAR: 37em > çdo telefon, pra 100% si më parë. */
    @media(min-width:1000px){
      body{background:var(--az-cream);}
      .wrap{
        max-width:none;
        width:92vw;              /* proporcional: panel÷ekran = 0.92 konstant */
        margin:18px auto;
        min-height:auto;
        border-radius:18px;
        border:1px solid var(--az-line);
        box-shadow:0 2px 8px rgba(0,0,0,.06),0 22px 54px -26px rgba(0,0,0,.28);
        overflow:hidden;         /* që këndet e rrumbullakosura t'i presin fëmijët */
      }
      /* Teksti mbush panelin në kolona; column-width në em → masa mbetet
         ~68 karaktere pavarësisht sa kolona nxë ekrani (2 @1280 … 4 @2560). */
      .content{
        columns:34em;
        column-gap:clamp(2rem,3.4vw,4.5rem);
        padding:34px clamp(28px,3vw,60px) 52px;
      }
      /* Titulli e versioni shtrihen mbi të gjitha kolonat (hyrje e vetme). */
      .content>h1,.content>.ver{column-span:all;}
      /* Mos i ndaj seksionet shëmtuar mes dy kolonave. */
      .content h2{break-inside:avoid;break-after:avoid;margin-top:0;}
      .content h2:not(:first-of-type){margin-top:22px;}
      .content p,.content ul,.content .note{break-inside:avoid;}
    }
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
          <div className="note">Raportimi i shpalljeve të dyshimta bëhet me butonin "Raporto" ose me email tek alpazarsuport@gmail.com. Shpalljet ilegale i raportohen autoriteteve kompetente.</div>

          <h2>5-a. Mbrojtja e Fëmijëve dhe Raportimi i Shkeljeve</h2>
          <p>Alpazar zbaton tolerancë zero ndaj çdo përmbajtjeje që dëmton ose shfrytëzon fëmijët:</p>
          <ul>
            <li>Çdo material seksual që përfshin të mitur <span className="law">(Kodi Penal, neni 117)</span> raportohet <strong>MENJËHERË</strong> te Policia e Shtetit dhe prokuroria kompetente — dhe hiqet pa paralajmërim.</li>
            <li>Moshat nën 16 vjeç nuk mund të regjistrohen <span className="law">(Ligji 124/2024, neni 8)</span>.</li>
            <li>Nuk lejohet asnjë kontakt privat i rritur–fëmijë brenda platformës.</li>
            <li>Çdo shpallje ose aktivitet i dyshimtë raportohet me butonin <span aria-hidden="true">⚠️</span> ose nëpërmjet <a href="/takedown" style={{ color: '#C42B0F' }}>/takedown</a>.</li>
          </ul>
          <div className="note">Shkeljet penale raportohen edhe pa kërkesën e viktimës. Platforma bashkëpunon plotësisht me autoritetet hetimore.</div>

          <h2>6. Shërbimi Premium</h2>
          <p>Shërbimi Premium ofrohet me tarifa mujore ose vjetore të publikuara në platformë, <strong>në lekë</strong>. Pagesa konfirmohet brenda 24 orësh pune. Abonimi anulohet kurdo te <a href="/billing" style={{ color: '#C42B0F' }}>Plani im</a> ose duke kontaktuar administratën; pas anulimit përfitimet vazhdojnë deri në fund të periudhës së paguar.</p>

          <h2>6-a. E drejta e heqjes dorë brenda 14 ditëve</h2>
          <p>Abonimi Premium blihet nga distanca, ndaj ti ke <strong>të drejtën ligjore ta heqësh dorë brenda 14 ditëve kalendarike</strong> nga dita e lidhjes së kontratës, <strong>pa dhënë asnjë arsye dhe pa asnjë penalitet</strong> <span className="law">(Ligji Nr. 9902/2008 "Për mbrojtjen e konsumatorëve", nenet 37/1–37/8)</span>.</p>
          <ul>
            <li><strong>Si bëhet:</strong> me një klikim te <a href="/billing" style={{ color: '#C42B0F' }}>Plani im</a> — butoni „Hiq dorë dhe kthe pagesën", ku shfaqen afati, ditët e mbetura dhe shuma që kthehet. Ose me një njoftim të qartë nga <a href="/kontakt" style={{ color: '#C42B0F' }}>faqja e kontaktit</a>. Nuk kërkohet formular i posaçëm dhe nuk kërkohet arsye.</li>
            <li><strong>Sa kthehet:</strong> shuma e paguar kthehet brenda <strong>14 ditëve</strong> nga marrja e njoftimit, me të njëjtën mënyrë pagese. Nëse ke kërkuar shprehimisht që shërbimi të nisë menjëherë, mbahet vetëm pjesa <strong>në raport me ditët e shfrytëzuara</strong> deri në njoftim — jo më shumë.</li>
            <li><strong>Kur nuk zbatohet:</strong> e drejta shuhet nëse shërbimi është përmbushur <em>plotësisht</em> brenda afatit me pëlqimin tënd paraprak të shprehur dhe me pranimin se e humb këtë të drejtë <span className="law">(neni 37/8)</span>.</li>
          </ul>
          <div className="note">Kjo është e drejtë e dhënë nga ligji, jo mirësjellje e platformës: nuk mund të kufizohet me kushte, as nga ky dokument. Nëse ndonjë tekst tjetër i këtyre kushteve duket se e ngushton, mbizotëron ligji.</div>

          <h2>7. Mbrojtja e të Dhënave Personale</h2>
          <p>Mbledhja, ruajtja dhe përpunimi i të dhënave personale kryhet në përputhje me <strong>Ligjin Nr. 124/2024 "Për mbrojtjen e të dhënave personale"</strong> (hyrë në fuqi 1 Janar 2025), i cili harmonizoi legjislacionin shqiptar me Rregulloren GDPR 2016/679 të BE-së.</p>
          <p>Për detaje të plota, shihni <a href="/privatesia" style={{ color: '#C42B0F' }}>Politikën e Privatësisë</a> dhe <a href="/cookies" style={{ color: '#C42B0F' }}>Politikën e Cookie-ve</a>.</p>
          <p className="law">Autoritet mbikëqyrëse: Komisioneri për Mbrojtjen e të Dhënave Personale — www.idp.al</p>

          <h2>8. Heqja dhe Notice-and-Takedown</h2>
          <p>Nëse besoni se një shpallje shkel të drejtat tuaja të autorit, privatësinë ose është ilegale, mund të paraqisni kërkesë formale <a href="/takedown" style={{ color: '#C42B0F' }}>këtu</a>. Alpazar shqyrton çdo kërkesë brenda 72 orëve pune dhe vepron sipas Ligjit Nr. 9880/2008 "Për nënshkrimin elektronik" dhe direktivave europiane mbi tregtinë elektronike.</p>

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
          <p>Pyetje ligjore dhe ankesa: <strong>alpazarsuport@gmail.com</strong><br />Alpazar · Tiranë, Shqipëri</p>
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
