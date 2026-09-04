'use client'

/*  SHIRITI I DESKTOPIT (majtas) — model Instagram web.
 *  Pse: ankesa e "marzheve bosh" në desktop s'zgjidhet duke shtrirë tekstin (do prishej
 *  leximi), por duke shtuar CHROME-in e desktopit — një shirit navigimi i përhershëm majtas +
 *  përmbajtje e qendërzuar. Shfaqet VETËM ≥1024px; telefoni mbetet me bar-in lart + bottom-nav.
 *  Zhvendosja e përmbajtjes bëhet me `body[data-desknav="1"]{padding-left}` te ui-refine.css —
 *  ky element është `position:fixed`, ndaj rri në zbrazëtirën 240px, dhe çdo gjë tjetër shkon djathtas.
 *  Fshihet te /admin (ka shiritin e vet) dhe /auth (ekrane hyrjeje).
 */

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useAlpazar } from '../../lib/context'

const HIDE_PREFIXES = ['/admin', '/auth']

export function DeskSidebar() {
  const pathname = usePathname() || '/'
  const { user, authReady } = useAlpazar()
  const hidden = HIDE_PREFIXES.some(p => pathname.startsWith(p))

  // Sinjali për zhvendosjen e përmbajtjes (padding-left te body ≥1024). Hiqet te faqet e fshehura.
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (hidden) document.body.removeAttribute('data-desknav')
    else document.body.setAttribute('data-desknav', '1')
  }, [hidden])

  if (hidden) return null

  const active = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  const Item = ({ href, icon, label }: { href: string; icon: string; label: string }) => (
    <a href={href} className={`ds-link ${active(href) ? 'on' : ''}`} aria-current={active(href) ? 'page' : undefined}>
      <i className={`ti ti-${icon}`} aria-hidden="true" />
      <span>{label}</span>
    </a>
  )

  return (
    <aside className="desk-sidebar" aria-label="Navigimi kryesor">
      <a href="/" className="ds-logo" aria-label="ALPAZAR — ballina">ALPAZAR</a>
      <nav className="ds-nav">
        <Item href="/" icon="home" label="Ballina" />
        <Item href="/search" icon="search" label="Kërko" />
        <Item href="/kategori" icon="category" label="Kategori" />
        <Item href="/biznese" icon="building-store" label="Biznese" />
        {user && <Item href="/messages" icon="message-2" label="Mesazhe" />}
        {user && <Item href="/notifications" icon="bell" label="Njoftime" />}
        {authReady && (user
          ? <Item href="/profile" icon="user" label="Profili" />
          : <Item href="/auth/login" icon="login" label="Hyr" />)}
      </nav>
      <a href="/listing/new" className="ds-cta">
        <i className="ti ti-plus" aria-hidden="true" />
        <span>Shto shpallje</span>
      </a>
    </aside>
  )
}
