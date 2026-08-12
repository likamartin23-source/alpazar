/**
 * Skeda "Gjurma" → ekrani "Sot".
 *
 * TodayTab ndodhej në depo pa u thirrur nga askush. Ekrani Sot e përmban
 * gjurmën e administratës si pjesë, dhe shton 30 treguesit e integritetit
 * nga `admin_health()` — të cilët ekzistonin dhe nuk shfaqeshin askund.
 *
 * Pra kjo skedë bëhet superbashkësi e asaj që ishte, jo zëvendësim.
 * Kur page.tsx të përditësohet, TodayTab kalon te skeda "Sot".
 */
export { TodayTab as AuditTab } from './TodayTab'
