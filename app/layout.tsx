import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Alpazar - Shit · Bli · Bëj Pazrin Tënd',
  description: 'Platforma #1 shqiptare e tregtisë dhe shpalljeve online. Zero reklama. Zero pagesa mes përdoruesve.',
  keywords: 'marketplace, shqiperi, shpallje, shit, bli, online',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sq">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body style={{ margin: 0, background: '#FFFBEA', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        {children}
        <footer style={{ background: '#111', padding: '22px 16px 28px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
          <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ color: '#F5C842', fontWeight: 700, fontSize: 13, letterSpacing: 1, marginBottom: 14 }}>🦅 ALPAZAR</div>
            <nav style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 14px', marginBottom: 14 }}>
              <a href="/kushtet" style={{ color: '#666', fontSize: 11, textDecoration: 'none' }}>Kushtet e Përdorimit</a>
              <a href="/privatesia" style={{ color: '#666', fontSize: 11, textDecoration: 'none' }}>Privatësia</a>
              <a href="/cookies" style={{ color: '#666', fontSize: 11, textDecoration: 'none' }}>Cookie-t</a>
              <a href="/rreth-nesh" style={{ color: '#666', fontSize: 11, textDecoration: 'none' }}>Rreth Nesh</a>
              <a href="/kontakt" style={{ color: '#666', fontSize: 11, textDecoration: 'none' }}>Kontakt</a>
              <a href="/siguria" style={{ color: '#666', fontSize: 11, textDecoration: 'none' }}>Siguria</a>
            </nav>
            <div style={{ fontSize: 10, color: '#444' }}>© 2025 Alpazar · Tiranë, Shqipëri · Të gjitha të drejtat e rezervuara</div>
          </div>
        </footer>
      </body>
    </html>
  )
}
