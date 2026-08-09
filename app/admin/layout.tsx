'use client'

import { usePathname } from 'next/navigation'

const LINKS = [
  ['/admin', 'layout-dashboard', 'Paneli'],
  ['/admin/users', 'users', 'Përdoruesit'],
  ['/admin/billing', 'credit-card', 'Billing'],
  ['/admin/limits', 'adjustments', 'Kufijtë'],
  ['/admin/invoices', 'file-invoice', 'Faturat'],
] as const

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return (
    <>
      {children}
      <style dangerouslySetInnerHTML={{ __html: `
        .adm-nav{position:fixed;left:0;right:0;bottom:0;z-index:9998;display:flex;
          background:#111;border-top:1px solid #2a2a2a;padding:6px 4px;gap:2px;
          box-shadow:0 -4px 16px rgba(0,0,0,.25)}
        .adm-nav a{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;
          padding:6px 2px;border-radius:9px;text-decoration:none;color:#8a8a8a;
          font-size:9.5px;font-weight:700;font-family:'Plus Jakarta Sans',system-ui,sans-serif}
        .adm-nav a.on{background:rgba(245,200,66,.14);color:#F5C842}
        .adm-nav i{font-size:16px}
      ` }} />
      <nav className="adm-nav" aria-label="Navigimi i administratës">
        {LINKS.map(([href, icon, label]) => (
          <a key={href} href={href} className={path === href ? 'on' : ''} aria-current={path === href ? 'page' : undefined}>
            <i className={`ti ti-${icon}`} aria-hidden="true" />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </>
  )
}
