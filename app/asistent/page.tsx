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
      <AlbiChat variant="page" />
    </>
  )
}
