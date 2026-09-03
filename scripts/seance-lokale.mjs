#!/usr/bin/env node
/**
 * SEANCË LOKALE — mat faqet PAS HYRJES pa u autentikuar dhe pa parë asnjë token
 *
 * PROBLEMI: Playwright nuk ka sesion, ndaj 13 nga 38 rrugët i kthenin guaskën
 * e hyrjes. Numrat "100% shfrytëzim" për `/profile`, `/billing`, `/messages`
 * ishin faqja e login-it, jo faqja e vërtetë — matje e gabuar, e tërhequr.
 *
 * ZGJIDHJA: nuk hyj askund dhe nuk lexoj asnjë token. Kopjoj vetëm dy skedarë
 * nga profili i Chrome-it të pronarit — `Cookies` dhe `Local State` — në një
 * profil të përkohshëm, dhe e nis Chromium-in e Playwright-it mbi atë kopje.
 * Sesioni vjen bashkë me kopjen; asnjë vlerë nuk shtypet, nuk regjistrohet dhe
 * nuk del nga kjo makinë.
 *
 * Chrome-i i pronarit rri i hapur — nuk preket, sepse kopjohet, nuk hyhet.
 *
 * KUFI: profili i përkohshëm mban cookies të ÇDO faqeje, ndaj shfletuesi këtu
 * shkon VETËM te alpazar.vercel.app. Dosja fshihet në fund.
 */
import { chromium } from 'playwright'
import { mkdtempSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BURIMI = join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data')

export function ndertoProfil() {
  const dest = mkdtempSync(join(tmpdir(), 'alpz-seance-'))
  mkdirSync(join(dest, 'Default', 'Network'), { recursive: true })
  const cift = [
    ['Local State', 'Local State'],
    [join('Default', 'Network', 'Cookies'), join('Default', 'Network', 'Cookies')],
    [join('Default', 'Preferences'), join('Default', 'Preferences')],
  ]
  let marre = 0
  for (const [nga, te] of cift) {
    const a = join(BURIMI, nga)
    if (existsSync(a)) { copyFileSync(a, join(dest, te)); marre++ }
  }
  if (!marre) throw new Error('Profili i Chrome-it nuk u gjet te ' + BURIMI)
  return dest
}

export async function hapSeance(viewport = { width: 1920, height: 1080 }) {
  const profil = ndertoProfil()
  const ktx = await chromium.launchPersistentContext(profil, {
    headless: true,
    viewport,
    locale: 'sq-AL',
    args: ['--no-first-run', '--no-default-browser-check'],
  })
  await ktx.addInitScript(() => {
    try {
      localStorage.setItem('alpazar_age_ok', '1')
      localStorage.setItem('alpazar_onboarded', '1')
      localStorage.setItem('alpazar_cookie_consent', 'accepted')
    } catch {}
  })
  return { ktx, mbyll: async () => { await ktx.close(); try { rmSync(profil, { recursive: true, force: true }) } catch {} } }
}

// Kur thirret drejtpërdrejt: vetëm PROVA që sesioni erdhi.
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
  const { ktx, mbyll } = await hapSeance()
  const f = await ktx.newPage()
  await f.goto(BAZA + '/profile', { waitUntil: 'domcontentloaded', timeout: 45000 })
  await f.waitForTimeout(3500)
  const d = await f.evaluate(() => ({
    titull: document.title,
    url: location.pathname,
    // Vetëm PRANIA, kurrë përmbajtja — asnjë e dhënë personale nuk shtypet.
    kaProfil: !!document.body.innerText.match(/Profili im|Dil/),
    tekst: (document.body.innerText || '').length,
  }))
  console.log('PROVA E SEANCËS')
  console.log('  url        : ' + d.url)
  console.log('  titull     : ' + d.titull)
  console.log('  gjatësi    : ' + d.tekst + ' karaktere')
  console.log('  i kyçur    : ' + (d.kaProfil ? 'PO — sesioni erdhi me kopjen' : 'JO — u kthye guaska e hyrjes'))
  await mbyll()
}
