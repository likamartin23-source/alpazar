/* Ikona e kategorisë — REZERVË EMOJI (5 shtator, ndreqje regresi U-08).
 *
 * Baza ruan SLUG-e Tabler te `categories.icon` ("device-mobile","car"…). POR fonti
 * i subset-it `tabler-icons-subset.css` ka vetëm 86 glife dhe 13 nga 16 slug-et e
 * kategorive MUNGOJNË → `<i class="ti ti-car">` del 0×0 (kuti bosh). Matje live
 * terminali @1280. Rendërimi si tekst (varianti i mëparshëm) ishte po aq i keq.
 *
 * Zgjidhja e sigurt: hartë slug→emoji për të 16 kategoritë (emoji rendohet
 * gjithmonë, me ngjyra, pa varësi fonti). Slug i panjohur → 🏷️ (kurrë bosh).
 * Rigjenerimi i subset-it Tabler (aestetika vijë) mbetet te U-08 e terminalit;
 * kjo është rezerva e sanksionuar që vret regresin tani.
 */
const EMOJI: Record<string, string> = {
  'device-mobile': '📱', 'car': '🚗', 'home': '🏠', 'shirt': '👕',
  'armchair': '🛋️', 'paw': '🐾', 'tools': '🛠️', 'briefcase': '💼',
  'salad': '🥗', 'plane': '✈️', 'ball': '⚽', 'book': '📚',
  'heart': '❤️', 'building-store': '🏪', 'device-gamepad': '🎮', 'dots': '🗂️',
}

export function CategoryIcon({ icon }: { icon?: string | null }) {
  if (!icon) return <>🏷️</>
  if (EMOJI[icon]) return <>{EMOJI[icon]}</>
  // Vlerë jo-slug (p.sh. tashmë emoji) → shfaqe si është.
  if (!/^[a-z0-9-]+$/.test(icon)) return <>{icon}</>
  // Slug i panjohur (s'e dimë a është në subset) → etiketë gjenerike, kurrë kuti bosh.
  return <>🏷️</>
}
