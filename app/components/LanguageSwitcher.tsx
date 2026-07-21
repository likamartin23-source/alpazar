'use client'
/** NdÃ«rrues gjuhe â€” dropdown i thjeshtÃ«, CSS inline, sipas konventave. */
import { useT, LANGS } from '../../lib/i18n'

export function LanguageSwitcher() {
  const { lang, setLang, t } = useT()
  const cur = LANGS.find(l => l.code === lang) ?? LANGS[0]
  return (
    <label data-no-translate style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
      <span aria-hidden="true" style={{ fontSize: 14 }}>{cur.flag}</span>
      <span style={{ position: 'absolute', left: -9999 }}>{t('lang_label')}</span>
      <select
        aria-label={t('lang_label')}
        value={lang}
        onChange={(e) => setLang(e.target.value as([J_Bˆİ[O^ŞÂˆ˜XÚÙÜ›İ[™ˆ	ÈÌXLXLXIËÛÛÜˆ	ÈÑPÎ‰Ë›Ü™\ˆ	Ì\ÛÛYÌÌÌÉËˆ›Ü™\”˜Y]\ÎˆY[™Îˆ	Í	Ë›ÛÚ^™NˆLK›ÛÙZYÚˆŒˆ›Û˜[Z[Nˆ‰Ô\È˜ZØ\HØ[œÉËŞ\İ[K]ZKØ[œË\Ù\šYˆ‹İ\œÛÜˆ	ÜÚ[\‰Ëˆ_Bˆ‚ˆÓS‘ÔË›X\
Oˆ
ˆÜ[ÛˆÙ^O^Û˜ÛÙ_H˜[YO^Û˜ÛÙ_Hİ[O^ŞÈ˜XÚÙÜ›İ[™ˆ	ÈÙ™™‰ËÛÛÜˆ	ÈÌLLIÈ_O‚ˆÛ™›YßHÛ›X™[BˆÛÜ[Û‚ˆ
J_BˆÜÙ[Xİ‚ˆÛX™[‚ˆ
BŸB