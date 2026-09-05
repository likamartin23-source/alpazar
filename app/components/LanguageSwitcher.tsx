'use client'
/**
 * Ndërrues gjuhe — pa flamuj, me qëllim.
 *
 * Dy arsye, të dyja të provuara:
 *
 * 1 · TEKNIKE. Windows nuk ka kurrë glife flamujsh. Emoji-t rajonalë 🇦🇱 🇬🇧 🇮🇹
 *     shfaqen atje si shkronjat "AL", "GB", "IT". U verifikua live më 17 gusht
 *     2026 në shfletuesin e pronarit: DOM-i mbante 🇦🇱, ekrani tregonte "AL".
 *     Meqë shumica e përdoruesve shqiptarë në desktop janë në Windows, flamujt
 *     ishin të shëmtuar për shumicën.
 *
 * 2 · KONCEPTUALE. Flamuri është shtet, jo gjuhë. Anglishtja nuk është vetëm
 *     Britania, spanjishtja nuk është vetëm Spanja. Prandaj Airbnb, Booking,
 *     Google dhe Wikipedia përdorin glob + emrin e gjuhës në gjuhën e vet.
 *     Ky është standardi, jo shija ime.
 *
 * Zgjidhja: një glob SVG i vendosur brenda (pa varësi nga fonti apo rrjeti) dhe
 * emri amtar i gjuhës. Shfaqet njësoj në çdo sistem.
 */
import { useT, LANGS } from '../../lib/i18n'

function Globi({ ngjyra }: { ngjyra: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke={ngjyra} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8M3.6 15h16.8" />
      <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
    </svg>
  )
}

export function LanguageSwitcher({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const { lang, setLang, t } = useT()
  const cur = LANGS.find(l => l.code === lang) ?? LANGS[0]
  const light = tone === 'light'
  const ngjyra = light ? '#5A4A12' : 'var(--az-yellow)'

  return (
    <label data-no-translate title={t('lang_label')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
        position: 'relative',
        background: light ? 'rgba(0,0,0,.07)' : 'var(--az-ink)',
        border: light ? '1px solid rgba(0,0,0,.06)' : '1px solid #333',
        borderRadius: 999, padding: light ? '4px 9px 4px 8px' : '5px 10px 5px 9px',
      }}>
      <Globi ngjyra={ngjyra} />
      <span aria-hidden="true" style={{
        fontSize: 'var(--fs-dysheme)', fontWeight: 700, color: ngjyra,
        whiteSpace: 'nowrap', letterSpacing: .1,
      }}>
        {cur.label}
      </span>
      <span style={{ position: 'absolute', left: -9999 }}>{t('lang_label')}</span>
      {/* Vetë select-i rri i padukshem siper: mban menunë amtare te sistemit —
          e aksesueshme me tastiere dhe e njohur nga cdo shfletues — nderkohe
          qe pamja mbetet e jona. */}
      <select
        aria-label={t('lang_label')}
        value={lang}
        onChange={(e) => setLang(e.target.value as any)}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          opacity: 0, cursor: 'pointer', border: 'none', appearance: 'none',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        {LANGS.map(l => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </label>
  )
}
