'use client'

export const dynamic = 'force-dynamic'

import AlbiChat from '../components/AlbiChat'

// Faqja e plotë e Albit — tani vetëm mbështjellëse mbi komponentin e përbashkët
// AlbiChat (i njëjti kod si paneli lundrues në homepage → një burim i vetëm i së vërtetës).
export default function AsistentPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#0e0e0e;overflow:hidden;}
      ` }} />
      {/* Titull semantik — i fshehur vizualisht (AlbiChat s'ka <h1>). a11y (lexues ekrani) + SEO [O64 B2]. */}
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>
        Albi — Asistenti virtual i Alpazar
      </h1>
      <AlbiChat variant="page" />
    </>
  )
}
