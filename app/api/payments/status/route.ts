import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GATI PËR T'U LIDHUR — sinjal statusi i leximit automatik të pagesave.
// Kthen VETËM një flamur boolean (kurrë sekretin) që paneli të tregojë nëse ofruesi i
// pagesës është lidhur. Pa PAYMENT_WEBHOOK_SECRET → leximi automatik është fail-closed dhe
// përdoret aprovimi manual (rrjeta e sigurisë). Pa dhënë asnjë të dhënë të ndjeshme.
export async function GET() {
  const configured = !!process.env.PAYMENT_WEBHOOK_SECRET
  return NextResponse.json(
    {
      configured,                    // a është vendosur sekreti i webhook-ut
      endpoint: '/api/payments/webhook',
      mode: configured ? 'auto+manual' : 'manual',  // pa sekret → vetëm manual
    },
    { headers: { 'cache-control': 'no-store' } },
  )
}
