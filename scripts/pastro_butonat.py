import os, sys, re

# ─── 1. Skedaret e vdekur: asgje nuk i thrret, dhe dublojne butona reale ───
TE_VDEKUR = [
    'app/admin/tabs/UserRow.tsx',        # 7 butona qe dublojne PeopleTab
    'app/admin/tabs/UsersTab.tsx',       # shim nga ristrukturimi
    'app/admin/tabs/AuditTab.tsx',       # shim
    'app/admin/tabs/BusinessesTab.tsx',  # shim
    'app/admin/tabs/Trend.tsx',
]
hequr = []
for f in TE_VDEKUR:
    if not os.path.exists(f):
        continue
    emri = os.path.basename(f).replace('.tsx', '')
    for rr, _, ff in os.walk('app'):
        for x in ff:
            p = os.path.join(rr, x)
            if p == f or not x.endswith(('.tsx', '.ts')):
                continue
            if re.search(r'\b' + emri + r'\b', open(p, encoding='utf-8').read()):
                if p not in TE_VDEKUR:
                    sys.exit('NUK eshte i vdekur: %s thirret nga %s' % (emri, p))
    os.remove(f)
    hequr.append(emri)

# ─── 2. Kerkesat Premium dublohen: "Pagesat" dhe "Abonimet" ───
P = 'app/admin/page.tsx'
s = open(P, encoding='utf-8').read()
if '{/* Premium Requests (FAZA 4-c) */}' in s:
    rr = s.split('\n')
    a = next(i for i, x in enumerate(rr) if '{/* Premium Requests (FAZA 4-c) */}' in x)
    nis = a + 1
    nd = len(rr[nis]) - len(rr[nis].lstrip())
    if 'className="card"' not in rr[nis]:
        sys.exit('struktura ndryshoi: prisja karten te rreshti %d' % (nis + 1))
    fund = next(i for i in range(nis + 1, len(rr))
                if rr[i].strip() == '</div>' and len(rr[i]) - len(rr[i].lstrip()) == nd)
    rr[a:fund + 1] = []
    s = '\n'.join(rr)
    open(P, 'w', encoding='utf-8').write(s)
    dublimi = True
else:
    dublimi = False

for o, c in (('{', '}'), ('(', ')'), ('[', ']')):
    if s.count(o) != s.count(c):
        sys.exit('kllapa %s: %d vs %d' % (o, s.count(o), s.count(c)))
for v in ('UserRow', 'UsersTab', 'AuditTab', 'BusinessesTab', '<Trend'):
    if v in s:
        sys.exit('referencë e vdekur ne page.tsx: %s' % v)

print('Hequr:', ', '.join(hequr) or 'asnje')
print('Dublimi i Kerkesave Premium:', 'u hoq' if dublimi else 'nuk u gjet')
print('page.tsx:', len(s.encode()), 'bajt')
