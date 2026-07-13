'use client'
/** Ndërrues gjuhe — dropdown i thjeshtë, CSS inline, sipas konventave. */
import { useT, LANGS } from '../../lib/i18n'

export function LanguageSwitcher() {
  const { lang, setLang, t } = useT()
  const cur = LANGS.find(l => l.code === lang) ?? LANGS[0]
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
      <span aria-hidden="true" style={{ fontSize: 14 }}>{cur.flag}</span>
      <span style={{ position: 'absolute', left: -9999 }}>{t('lang_label')}</span>
      <select
        aria-label={t('lang_label')}
        value={lang}
        onChange={(e) => setLang(e.target.value as any)}
        style={{
          background: '#1a1a1a', color: '#F5C842', border: '1px solid #333',
          borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 600,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", cursor: 'pointer',
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
