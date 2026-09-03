'use client'
/** Footer i përkthyeshëm — nxjerrë nga layout.tsx që të përdorë useT() + LanguageSwitcher. */
import { usePathname } from 'next/navigation'
import { useT } from '../../lib/i18n'
import { LanguageSwitcher } from './LanguageSwitcher'

const soc = [
  { href: 'https://facebook.com/alpazaral',        label: 'Facebook',    icon: 'ti-brand-facebook' },
  { href: 'https://instagram.com/alpazaral',       label: 'Instagram',   icon: 'ti-brand-instagram' },
  { href: 'https://tiktok.com/@alpazaral',         label: 'TikTok',      icon: 'ti-brand-tiktok' },
  { href: 'https://t.me/alpazaral',                label: 'Telegram',    icon: 'ti-brand-telegram' },
  { href: 'https://linkedin.com/company/alpazar',  label: 'LinkedIn',    icon: 'ti-brand-linkedin' },
  { href: 'https://x.com/alpazaral',               label: 'X / Twitter', icon: 'ti-brand-x' },
]

export function SiteFooter() {
  const { t } = useT()
  const pathname = usePathname()
  // Paneli i administrimit ka navigimin e vet dhe nuk eshte faqe publike:
  // fundi i faqes me lidhjet e marketingut, rrjetet sociale dhe nje kontroll
  // gjuhe te dyte vetem shton zhurme atje (pare me sy me 31 gusht 2026).
  if (pathname?.startsWith('/admin')) return null
  // Kontrast i matur me axe-core mbi var(--az-black) (WCAG 2.1 AA kerkon 4.5:1 per
  // tekst normal): #666666 jepte 3.29 — deshtim ne CDO faqe, sepse fundi
  // shfaqet kudo. #9A9A9A jep 6.71 dhe e ruan hierarkine ndaj rreshtit te
  // te drejtave (#8A8A8A, 5.47), qe mbetet me i zbehte se lidhjet.
  const link: React.CSSProperties = { color: '#9A9A9A', fontSize: 11, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 4px' }
  return (
    <footer style={{ background: '#111', padding: '22px 16px 28px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        {/* Logoja e fundit është BUTON drejt kryefaqes (urdhër pronari): e dukshme,
            e kuptueshme (aria), e prekshme (≥44px). */}
        <a href="/" aria-label="ALPAZAR — Kryefaqja" style={{ color: 'var(--az-yellow)', fontWeight: 700, fontSize: 13, letterSpacing: 1, marginBottom: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, padding: '0 10px' }}><img src="/icons/eagle.svg" alt="" aria-hidden="true" style={{ height: '0.9em', verticalAlign: '-0.12em', display: 'inline-block' }} /> ALPAZAR</a>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 14 }}>
          {soc.map(s => (
            <a key={s.label} href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer" style={{ color: '#555', fontSize: 19, textDecoration: 'none', width: 44, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><i className={`ti ${s.icon}`} aria-hidden="true" /></a>
          ))}
        </div>
        <nav aria-label="Footer" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 14px', marginBottom: 14 }}>
          <a href="/kategori" style={link}>{t('nav_categories')}</a>
          <a href="/biznese" style={link}>{t('nav_businesses')}</a>
          <a href="/search" style={link}>{t('nav_search')}</a>
          <a href="/kushtet" style={link}>{t('nav_terms')}</a>
          <a href="/privatesia" style={link}>{t('nav_privacy')}</a>
          <a href="/cookies" style={link}>{t('nav_cookies')}</a>
          <a href="/rreth-nesh" style={link}>{t('nav_about')}</a>
          <a href="/kontakt" style={link}>{t('nav_contact')}</a>
          <a href="/siguria" style={link}>{t('nav_security')}</a>
          <a href="/te-dhenat-mia" style={link}>{t('nav_mydata')}</a>
          <a href="/takedown" style={link}>{t('nav_takedown')}</a>
          <a href="/referral" style={{ color: 'var(--az-yellow)', fontSize: 11, textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 4px', gap: 4 }}><span aria-hidden="true">🎁</span> {t('nav_referral')}</a>
        </nav>
        <div style={{ marginBottom: 14 }}><LanguageSwitcher /></div>
        <div style={{ fontSize: 10, color: '#8A8A8A' }}>© 2026 Alpazar · NIPT/QKB: (në regjistrim) · Tiranë, Shqipëri · {t('rights')}</div>
      </div>
    </footer>
  )
}
