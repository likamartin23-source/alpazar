'use client'
/** Footer i përkthyeshëm — nxjerrë nga layout.tsx që të përdorë useT() + LanguageSwitcher. */
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
  const link: React.CSSProperties = { color: '#666', fontSize: 11, textDecoration: 'none' }
  return (
    <footer style={{ background: '#111', padding: '22px 16px 28px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ color: '#F5C842', fontWeight: 700, fontSize: 13, letterSpacing: 1, marginBottom: 14 }}><img src="/icons/eagle.svg" alt="" aria-hidden="true" style={{ height: '0.9em', verticalAlign: '-0.12em', display: 'inline-block' }} /> ALPAZAR</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginBottom: 14 }}>
          {soc.map(s => (
            <a key={s.label} href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer" style={{ color: '#555', fontSize: 19, textDecoration: 'none' }}><i className={`ti ${s.icon}`} aria-hidden="true" /></a>
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
          <a href="/referral" style={{ color: '#F5C842', fontSize: 11, textDecoration: 'none', fontWeight: 600 }}><span aria-hidden="true">🎁</span> {t('nav_referral')}</a>
        </nav>
        <div style={{ marginBottom: 14 }}><LanguageSwitcher /></div>
        <div style={{ fontSize: 10, color: '#444' }}>© 2026 Alpazar · NIPT/QKB: (në regjistrim) · Tiranë, Shqipëri · {t('rights')}</div>
      </div>
    </footer>
  )
}
