/**
 * Skeda e tretë → ekrani "Radha".
 *
 * PSE KËTU: skeda "Moderimi", e përcaktuar brenda `page.tsx`, kërkon
 * `listings.seller_id` — një kolonë që NUK ekziston; e vërteta është `user_id`.
 * PostgREST kthen `42703`, `data` mbetet null dhe skeda shfaq përherë
 * "Asnjë raport i hapur" edhe kur ka raporte. Provuar drejtpërdrejt kundër API-t.
 *
 * Domethënë moderimi sot është i verbër, ndërsa zëvendësuesi që punon rri i
 * paarritshëm vetëm sepse `page.tsx` nuk është përditësuar ende. Afatet ligjore
 * nuk presin për një riemërtim skede — neni 17/1/b i ligjit 10128 kërkon veprim
 * me marrjen dijeni.
 *
 * Etiketa anash do të thotë ende "Bizneset"; koka e faqes thotë "Radha".
 * Bizneset nuk humbasin: ndodhen brenda dosjes së personit te PeopleTab, me
 * verifikimin dhe errësimin e tyre.
 */
export { QueueTab as BusinessesTab } from './QueueTab'
