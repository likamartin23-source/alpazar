#!/usr/bin/env python3
"""Ristrukturimi i panelit: 17 skeda -> 12, zero mbivendosje.

Idempotent: nese page.tsx eshte i ristrukturuar tashme, del pa bere asgje.
Ekzekutohet nga .github/workflows/panel-ristrukturim.yml
"""
import sys

P = 'app/admin/page.tsx'
s = open(P, encoding='utf-8').read()

if "from './tabs/QueueTab'" in s:
    print('Paneli eshte tashme i ristrukturuar - asnje ndryshim.')
    sys.exit(0)

s = s.replace(
    "import { LimitsTab } from './tabs/LimitsTab'",
    "import { LimitsTab } from './tabs/LimitsTab'\n"
    "import { QueueTab } from './tabs/QueueTab'\n"
    "import { PeopleTab } from './tabs/PeopleTab'\n"
    "import { TodayTab } from './tabs/TodayTab'", 1)

s = s.replace("      ['dash',       'layout-dashboard', 'Dashboard'],",
              "      ['dash',       'layout-dashboard', 'Sot'],", 1)
s = s.replace("      ['users',      'users',            'Përdoruesit'],\n"
              "      ['biznese',    'building-store',   'Bizneset'],",
              "      ['njerez',     'users',            'Njerëzit'],", 1)
s = s.replace("      ['invoices',   'file-invoice',     'Faturat'],",
              "      ['invoices',   'file-invoice',     'Paratë'],", 1)
s = s.replace("      ['moderation', 'shield-check',     'Moderimi'],\n"
              "      ['takedown',   'gavel',            'Heqja'],",
              "      ['radha',      'shield-check',     'Radha'],", 1)
s = s.replace("      ['limits',     'adjustments',      'Kufijtë'],\n"
              "      ['config',     'settings-2',       'Konfigurime'],\n"
              "      ['roles',      'key',              'Rolet'],\n"
              "      ['audit',      'history',          'Gjurma'],\n"
              "      ['health',     'activity-heartbeat', 'AI Health'],",
              "      ['config',     'settings-2',       'Konfigurime'],\n"
              "      ['roles',      'key',              'Rolet'],\n"
              "      ['health',     'activity-heartbeat', 'AI Health'],", 1)

s = s.replace("    users: 'users.view', biznese: 'business.view', broadcast: 'broadcast.send',",
              "    njerez: 'users.view', broadcast: 'broadcast.send',", 1)
s = s.replace("    moderation: 'content.moderate', takedown: 'content.moderate',\n"
              "    limits: 'config.write', config: 'config.write',\n"
              "    roles: 'audit.view', audit: 'audit.view', health: 'audit.view',",
              "    radha: 'content.moderate', config: 'config.write',\n"
              "    roles: 'audit.view', health: 'audit.view',", 1)

L = s.split('\n')
a = next(i for i, l in enumerate(L) if l.strip() == "{tab === 'dash' && (")
b = next(i for i in range(a, len(L)) if L[i].strip() == '</>' and L[i + 1].strip() == ')}') + 1
L[a:b + 1] = ["              {tab === 'dash' && <TodayTab stats={stats} trends={trends} />}"]
s = '\n'.join(L)

s = s.replace("              {tab === 'config' && <AppConfigTab />}",
              "              {tab === 'config' && <LimitsTab />}", 1)
for r in ("              {tab === 'moderation' && <ModerationTab />}\n",
          "              {tab === 'takedown' && <TakedownTab />}\n",
          "              {tab === 'limits' && <LimitsTab />}\n",
          "              {tab === 'audit' && <AuditTab />}\n",
          "              {tab === 'biznese' && <BusinessesTab />}\n"):
    s = s.replace(r, '', 1)
s = s.replace("              {tab === 'users' && <UsersTab />}",
              "              {tab === 'njerez' && <PeopleTab />}\n"
              "              {tab === 'radha' && <QueueTab />}", 1)

for imp in ("import { UsersTab } from './tabs/UsersTab'\n",
            "import { AuditTab } from './tabs/AuditTab'\n",
            "import { BusinessesTab } from './tabs/BusinessesTab'\n",
            "import { Trend } from './tabs/Trend'\n"):
    s = s.replace(imp, '', 1)


def hiq(t, emri):
    rr = t.split('\n')
    s0 = next((i for i, l in enumerate(rr) if l.startswith('function %s(' % emri)), None)
    if s0 is None:
        return t
    e0 = next((j for j in range(s0 + 1, len(rr)) if rr[j] == '}'), None)
    if e0 is None:
        return t
    if s0 > 0 and rr[s0 - 1].startswith('/*') and '─' in rr[s0 - 1]:
        s0 -= 1
    return '\n'.join(rr[:s0] + rr[e0 + 1:])


for c in ('ModerationTab', 'TakedownTab', 'AppConfigTab'):
    s = hiq(s, c)

for o, c in (('{', '}'), ('(', ')'), ('[', ']')):
    if s.count(o) != s.count(c):
        sys.exit('Kllapat e pabalancuara: %s' % o)
for vd in ('ModerationTab', 'TakedownTab', 'AppConfigTab', 'UsersTab', 'AuditTab', 'BusinessesTab'):
    if vd in s:
        sys.exit('Referenca e vdekur: %s' % vd)

open(P, 'w', encoding='utf-8').write(s)
print('OK - %d bajt, %d rreshta' % (len(s.encode()), s.count('\n') + 1))
