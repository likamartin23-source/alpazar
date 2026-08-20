"use client"

/**
 * UPDATE PROMPT — ÇARMATOSUR QËLLIMISHT (pa asnjë ringarkim automatik).
 *
 * PSE: Versioni i mëparshëm krahasonte build-id-in e ngulitur në faqe me atë të
 * `/api/version` dhe, në mospërputhje, e RINGARKONTE faqen vetvetiu — pas 25s,
 * në `visibilitychange`, dhe ndër-skeda me BroadcastChannel. Kur dokumenti dhe
 * `/api/version` binin te sinjale build-id jokonsistente (skew vendosjesh /
 * fallback `Date.now()`), kjo prodhonte një CIKËL ringarkimi të dhunshëm e të
 * padukshëm që përdoruesi e përjetonte si "versioni i ri flakeron dhe kthehet
 * me forcë te i vjetri" — EDHE në incognito, sepse s'varej nga cache-i.
 *
 * TANI: freskia garantohet tërësisht nga serveri (`force-dynamic` + middleware
 * `no-store`) dhe nga mungesa e Service Worker-it (kill-switch). Çdo navigim merr
 * HTML të freskët nga rrjeti. Prandaj asnjë mekanizëm ringarkimi në klient nuk
 * është më i nevojshëm — dhe çdo ringarkim automatik i bazuar në një sinjal
 * jo-100%-të-besueshëm është i rrezikshëm. Ndaj ky komponent nuk bën ASGJË
 * automatike: pa poll, pa timer, pa reload. Mbetet si pikë-zgjerimi për një
 * njoftim strikt opt-in (vetëm me klik) nëse do të duhet në të ardhmen.
 */
export default function UpdatePrompt() {
  return null
}
