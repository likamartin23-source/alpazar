/* Ikona e kategorisë. DB-ja ruan SLUG-e Tabler ("device-mobile","car"…), jo emoji.
 * Më parë faqet i shfaqnin si TEKST (defekt nga fotoja e pronarit, 5 shtator).
 * Nëse vlera është slug (a-z, shifra, viza) → ikona Tabler `ti ti-<slug>`;
 * përndryshe (emoji ose bosh) → teksti/emoji-ja. Komponent pa gjendje (server-safe). */
export function CategoryIcon({ icon }: { icon?: string | null }) {
  if (icon && /^[a-z][a-z0-9-]*$/.test(icon)) {
    return <i className={`ti ti-${icon}`} aria-hidden="true" />
  }
  return <>{icon || '🏷️'}</>
}
