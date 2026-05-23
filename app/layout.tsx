import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Alpazar - Shit - Bli - Bej Pazrin Tend',
  description: 'Platforma #1 shqiptare e tregtise dhe shpalljeve online. Zero reklama.',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sq">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"/>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      </head>
      <body style={{ margin:0, background:'#FFFBEA', fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
