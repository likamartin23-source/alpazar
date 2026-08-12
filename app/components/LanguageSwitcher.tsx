'use client'
/** Ndërrues gjuhe — dy tone: 'dark' (footer, panel) dhe 'light' (koka e verdhë). */
import { useT, LANGS } from '../../lib/i18n'

export function LanguageSwitcher({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const { lang, setLang, t } = useT()
  const cur = LANGS.find(l => l.code === lang) ?? LANGS[0]
  const light = tone === 'light'
  return (
    <label data-no-translate style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
      <span aria-hidden="true" style={{ fontSize: 14 }}>{cur.flag}</span>
      <span style={{ position: 'absolute', left: -9999 }}>{t('lang_label')}</span>
      <select
        aria-label={t('lang_label')}
        value={lang}
        onChange={(e) => setLang(e.target.value as any)}
        style={{
          background: light ? 'rgba(0,0,0,.08)' : '#1a1a1a',
          color: light ? '#111' : '#F5C842',
          border: light ? 'none' : '1px solid #333',
          borderRadius: light ? 20 : 8,
          padding: light ? '4px 6px' : '4px 8px',
          fontSize: light ? 10 : 11,
          fontWeight: 700,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          cursor: 'pointer',
          maxWidth: light ? 92 : undefined,
        }}
      >
        {LANGS.map(l => (
          <option key={l.code} value={l.code} style={{ background: '#fff', color: '#111' }}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    </label>
  )
}
