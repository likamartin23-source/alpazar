'use client'

/**
 * Buton "Kthehu mbrapa" i VETËM për gjithë aplikacionin.
 *
 * Më parë ekzistonte në TRE zbatime paralele (/biznese/{id}, /biznese lista, /listing) me
 * madhësi të ndryshme prekjeje (44, 22×23, 32×32) — kur njëri rregullohej, dy të tjerët mbeteshin
 * (§4-bis: i njëjti kontroll, tre zbatime). Ky komponent garanton në NJË vend: zonë prekjeje
 * ≥44×44px (Vendimi 8) + `history.back()` + etiketë. Pamja (sfond/ngjyrë/pozicion) jepet nga
 * `style`/`iconStyle` sipas kontekstit, që harmonia vizuale e secilës faqe të ruhet.
 */
export function BackButton({
  style,
  iconStyle,
  onClick,
  ariaLabel = 'Kthehu mbrapa',
}: {
  style?: React.CSSProperties
  iconStyle?: React.CSSProperties
  onClick?: () => void
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick ?? (() => window.history.back())}
      style={{
        width: 44, height: 44, minWidth: 44, minHeight: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', background: 'none', cursor: 'pointer', padding: 0,
        ...style,
      }}
    >
      <i className="ti ti-arrow-left" aria-hidden="true" style={iconStyle} />
    </button>
  )
}
