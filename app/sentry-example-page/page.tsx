'use client'
import * as Sentry from '@sentry/nextjs'

export default function SentryExamplePage() {
  const throwError = () => {
    throw new Error('Sentry Example Error — Alpazar Test')
  }

  const captureManual = () => {
    Sentry.captureException(new Error('Manual capture test'))
    alert('Error captured manually — check Sentry dashboard')
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', fontFamily: 'sans-serif', padding: '24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a' }}>Sentry Test — Alpazar</h1>
      <p style={{ color: '#666', maxWidth: '400px', textAlign: 'center' }}>
        Këto butona testojnë nëse Sentry po kap gabimet. Shiko dashboard-in pas shtypjes.
      </p>

      <button
        onClick={throwError}
        style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '16px', cursor: 'pointer', fontWeight: 600 }}
      >
        Throw Error (Test Sentry)
      </button>

      <button
        onClick={captureManual}
        style={{ background: '#FF6B35', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '16px', cursor: 'pointer', fontWeight: 600 }}
      >
        Capture Manual Exception
      </button>

      <button
        onClick={() => {
          // @ts-expect-error intentional — Sentry wizard test
          myUndefinedFunction()
        }}
        style={{ background: '#805ad5', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '16px', cursor: 'pointer', fontWeight: 600 }}
      >
        myUndefinedFunction() — Wizard Test
      </button>

      <p style={{ color: '#999', fontSize: '13px', marginTop: '16px' }}>
        Faqe e testit — hiqe nga produksioni kur konfirmohet Sentry
      </p>
    </main>
  )
}
