#!/usr/bin/env python3
"""Ndërrimi i gjuhëve 100% aktiv në të gjithë platformën.

1. lib/i18n.tsx  — përkthen edhe atributet (placeholder, aria-label, title, alt),
                   mbron kodet/shumat nga përkthimi, paneli rri shqip pa zgjedhje.
2. HomeClient    — ndërruesi i gjuhës në kokë, aty ku shihet.
3. admin/page    — ndërruesi në shiritin anësor + etiketa shqip + shenja e Radhës.
4. shpallja      — fleta e re e raportimit me dy rrugë.

Idempotent. Ekzekutohet nga .github/workflows/gjuha.yml
"""
import sys

ndryshime = 0


def zevendeso(rruga, i_vjetri, i_riu, sa=1):
    global ndryshime
    t = open(rruga, encoding='utf-8').read()
    if i_riu in t:
        return
    if t.count(i_vjetri) < 1:
        sys.exit('NUK U GJET ne %s: %r' % (rruga, i_vjetri[:70]))
    open(rruga, 'w', encoding='utf-8').write(t.replace(i_vjetri, i_riu, sa))
    ndryshime += 1


# ─── 1. lib/i18n.tsx ──────────────────────────────────────
I = 'lib/i18n.tsx'

zevendeso(I,
"const hasLetters = (s: string) => /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ]/.test(s)",
"""const hasLetters = (s: string) => /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ]/.test(s)
/* Kodet, shumat, emailet dhe URL-te nuk perkthehen kurre: nje fature 'ALP-2026-00001'
   ose '999.90 ALL' e perkthyer eshte gabim i rende, jo permiresim. */
const eshteKod = (s: string) => (
  (/\\d/.test(s) && s.split(/\\s+/).length <= 4) ||
  /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(s) ||
  /^https?:\\/\\//i.test(s) ||
  /^#[0-9A-Fa-f]{3,8}$/.test(s) ||
  (s.length <= 6 && s === s.toUpperCase() && /[A-Z]/.test(s))
)
/* Atributet qe permbajne tekst per njeriun ose per lexuesin e ekranit. */
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt']""")

zevendeso(I,
"""  const nav = (navigator.language || 'sq').slice(0, 2).toLowerCase()""",
"""  // Paneli eshte mjet i brendshem shqip. Pa nje zgjedhje te shprehur te adminit
  // nuk perkthehet nga gjuha e shfletuesit — perndryshe hapet gjithmone anglisht.
  try { if (location.pathname.startsWith('/admin')) return 'sq' } catch {}
  const nav = (navigator.language || 'sq').slice(0, 2).toLowerCase()""")

zevendeso(I,
"      if (t0.length < 2 || t0.length > 160 || !hasLetters(t0)) return",
"      if (t0.length < 2 || t0.length > 160 || !hasLetters(t0) || eshteKod(t0)) return")

zevendeso(I,
"""      document.querySelectorAll('input[placeholder]').forEach((el) => {
        const e = el as HTMLInputElement
        const orig = e.getAttribute('data-i18n-ph') ?? e.getAttribute('placeholder') ?? ''
        const i = idx.get(orig)
        if (i === undefined) return
        if (!e.getAttribute('data-i18n-ph')) e.setAttribute('data-i18n-ph', orig)
        e.setAttribute('placeholder', tr ? tr[i] : orig)
      })""",
"""      applyAttrs(root as Element | Document)""")

zevendeso(I,
"""    const applyNode = (root: Node) => {""",
"""    const applyAttr = (el: Element, a: string) => {
      const bak = 'data-i18n-' + a
      const orig = el.getAttribute(bak) ?? el.getAttribute(a) ?? ''
      const t0 = orig.trim()
      if (!t0) return
      if (!el.hasAttribute(bak)) el.setAttribute(bak, orig)
      const i = idx.get(t0)
      if (i !== undefined) { el.setAttribute(a, tr ? tr[i] : orig); return }
      if (!tr) { el.setAttribute(a, orig); return }
      if (t0.length < 2 || t0.length > 160 || !hasLetters(t0) || eshteKod(t0)) return
      if (cache[t0] !== undefined) { el.setAttribute(a, cache[t0]); return }
      if (!pendingSet.has(t0)) { pendingSet.add(t0); queue.add(t0) }
    }
    const applyAttrs = (root: Element | Document) => {
      ATTRS.forEach(a => {
        if (root instanceof Element && root.hasAttribute(a) && !root.closest('[data-no-translate]')) applyAttr(root, a)
        root.querySelectorAll('[' + a + ']').forEach(el => {
          if (el.closest('[data-no-translate]')) return
          applyAttr(el, a)
        })
      })
    }
    const applyNode = (root: Node) => {""")

# ─── 2. HomeClient: nderruesi ne koke ──────────────────────
H = 'app/HomeClient.tsx'
zevendeso(H,
"import { useRealtimeTable } from '../hooks/useRealtimeTable'",
"import { useRealtimeTable } from '../hooks/useRealtimeTable'\nimport { LanguageSwitcher } from './components/LanguageSwitcher'")

zevendeso(H,
"""            <div className="nav">
              {user && unreadNotifications > 0 && (""",
"""            <div className="nav">
              <LanguageSwitcher tone="light" />
              {user && unreadNotifications > 0 && (""")

# ─── 3. Paneli: nderruesi ne shirit + shqip + shenja e Radhes ───
A = 'app/admin/page.tsx'
zevendeso(A,
"import { RolesTab } from './tabs/RolesTab'",
"import { RolesTab } from './tabs/RolesTab'\nimport { LanguageSwitcher } from '../components/LanguageSwitcher'")

zevendeso(A,
'<div className="r">Admin Panel</div>',
'<div className="r">Paneli i Administrimit</div>')

zevendeso(A,
"              {id === 'moderation' && stats.reports > 0 && (",
"              {id === 'radha' && stats.reports > 0 && (")

zevendeso(A,
"""          <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: '1px solid #1e1e1e' }}>
            <a href="/" style={{ color: '#666', fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>""",
"""          <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <LanguageSwitcher />
            <a href="/" style={{ color: '#666', fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>""")

for f in (I, H, A):
    s = open(f, encoding='utf-8').read()
    for o, c in (('{', '}'), ('(', ')'), ('[', ']')):
        if s.count(o) != s.count(c):
            sys.exit('Kllapat e pabalancuara ne %s: %s' % (f, o))

print('OK — %d ndryshime' % ndryshime)


# ─── 4. Fleta e raportimit me dy rrugë në faqen e shpalljes ─────
L = 'app/listing/[id]/ListingPageClient.tsx'
t = open(L, encoding='utf-8').read()
if 'ReportSheet' not in t:
    rr = t.split('\n')

    # a) blloku i vjeter i modalit -> komponenti i ri
    a = next(i for i, x in enumerate(rr) if x.strip() == '{reportOpen && (')
    nda = len(rr[a]) - len(rr[a].lstrip())
    b = next(i for i in range(a + 1, len(rr))
             if rr[i].strip() == ')}' and len(rr[i]) - len(rr[i].lstrip()) == nda)
    rr[a:b + 1] = [
        '      {reportOpen && (',
        '        <ReportSheet',
        '          listingId={params.id}',
        '          userId={user?.id || null}',
        '          onClose={() => setReportOpen(false)}',
        '        />',
        '      )}',
    ]

    # b) kodi i vdekur: gjendjet, lista e ngurte e arsyeve, dergimi i vjeter
    def hiq_bllok(rrjeshtat, fillimi, mbarimi_strip):
        s0 = next((i for i, x in enumerate(rrjeshtat) if x.strip().startswith(fillimi)), None)
        if s0 is None:
            sys.exit('NUK U GJET blloku: %s' % fillimi)
        nd = len(rrjeshtat[s0]) - len(rrjeshtat[s0].lstrip())
        e0 = next((j for j in range(s0 + 1, len(rrjeshtat))
                   if rrjeshtat[j].strip() == mbarimi_strip
                   and len(rrjeshtat[j]) - len(rrjeshtat[j].lstrip()) == nd), None)
        if e0 is None:
            sys.exit('NUK U GJET fundi i bllokut: %s' % fillimi)
        return rrjeshtat[:s0] + rrjeshtat[e0 + 1:]

    rr = hiq_bllok(rr, 'async function submitReport()', '}')
    rr = hiq_bllok(rr, 'const REPORT_REASONS = [', ']')
    rr = [x for x in rr if not (
        x.strip().startswith('const [reportReason,')
        or x.strip().startswith('const [reportSent,')
        or x.strip().startswith('const [reportLoading,')
        or x.strip().startswith('const [reportErr,'))]

    t = '\n'.join(rr)
    t = t.replace(
        "import { SocialProofBar, SellerPremiumUpsell } from '../../components/PremiumUpsell'",
        "import { SocialProofBar, SellerPremiumUpsell } from '../../components/PremiumUpsell'\n"
        "import { ReportSheet } from '../../components/ReportSheet'", 1)

    for i_vdekur in ('submitReport', 'REPORT_REASONS', 'reportReason', 'reportSent',
                     'reportLoading', 'reportErr'):
        if i_vdekur in t:
            sys.exit('Mbeti referencë e vdekur: %s' % i_vdekur)
    if 'ReportSheet' not in t:
        sys.exit('ReportSheet nuk u lidh')
    for o, c in (('{', '}'), ('(', ')'), ('[', ']')):
        if t.count(o) != t.count(c):
            sys.exit('Kllapat e pabalancuara ne %s: %s' % (L, o))
    open(L, 'w', encoding='utf-8').write(t)
    ndryshime += 1
    print('Fleta e raportimit u lidh.')

print('GJITHSEJ %d ndryshime' % ndryshime)
