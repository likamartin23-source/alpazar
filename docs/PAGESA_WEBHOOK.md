# Lidhja me sistemet e marrjes së pagesave (webhook) — GATI

Alpazar është **gati të lidhet** me çdo ofrues pagese. Deri sa të lidhet, leximi automatik
është *fail-closed* dhe përdoret **aprovimi manual** (dhurim/aprovim nga paneli) si rrjetë sigurie.

## Hapat për ta lidhur (turnkey)
1. **Vendos sekretin** në mjedis (Vercel → Environment Variables):
   `PAYMENT_WEBHOOK_SECRET = <sekret i fortë>` (vetëm Martineli; kurrë në kod).
2. **Konfiguro ofruesin** të dërgojë callback (webhook) te:
   `POST https://alpazar.vercel.app/api/payments/webhook`
3. **Nënshkrimi**: ofruesi (ose një adapter i hollë) dërgon header-in
   `x-alpazar-signature = HMAC-SHA256(rawBody, PAYMENT_WEBHOOK_SECRET)` në hex.
4. **Statusi**: paneli e tregon si "e lidhur" automatikisht (`GET /api/payments/status`
   → `{configured:true}`). Pa sekret → "e palidhur — aprovim manual".

## Kontrata e trupit (payload i normalizuar)
```json
{
  "provider": "emri-ofruesit",         // p.sh. "paysera", "easypay"
  "provider_ref": "ID-unike-e-transaksionit",  // ose "id"
  "user_id": "uuid-i-perdoruesit",     // OSE "email": "user@shembull.al"
  "plan_id": "uuid-i-planit",          // OSE "plan_slug": "premium-1m" | "boost-1m" | ...
  "amount": 999.90,
  "currency": "ALL",                    // ose "EUR"
  "event_type": "payment"               // ose "refund"
}
```

## Garancitë (tashmë të ndërtuara)
- **Fail-closed**: pa sekret → `503 not_configured`; nënshkrim i gabuar → `401`.
- **Idempotencë**: `process_payment_event` përdor `on conflict (provider, provider_ref)`;
  ripërsëritja s'jep dyfishim (kthen `already`).
- **Paraja s'humbet kurrë**: edhe kur përdoruesi/plani s'njihet ose grant-i dështon,
  transaksioni regjistrohet me status `review`/`grant_failed` dhe shfaqet në panel.
- **Rrjeta e sigurisë**: `reconcile_payments()` (/5 min) riprocesson `received`/`grant_failed`;
  `payments_health_check_run()` (ditor) alarmon adminët për transaksione të ngecura.
- **Refund/chargeback**: `event_type='refund'` revokon abonimin (best-effort) + shënon `refunded`.
- **Grante**: `payment → grant_premium` (Premium ose VIP Ekstra Boost) → abonim + skadim +
  faturë (kur amount>0) + njoftim + restaurim shpalljesh.
- **Raportim në kohë reale**: çdo transaksion shfaqet menjëherë te paneli (Abonimet →
  Pagesat automatike), i renditur sipas orës.

## Adapter për ofrues me shape të ndryshëm
Nëse ofruesi s'e dërgon dot pikërisht këtë JSON, vendos një **adapter të hollë** (Edge/Server)
që normalizon fushat e tij në kontratën e mësipërme përpara se t'i dërgojë te
`/api/payments/webhook` me nënshkrimin HMAC. Bërthama (`process_payment_event`) mbetet e njëjtë.
