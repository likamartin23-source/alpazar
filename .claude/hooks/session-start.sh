#!/bin/bash
# SessionStart — tri detyra, te gjitha te lehta.
#
# 1. Printon indeksin e skills-eve. Pa te, nje sesion i ri i "gjen" skills vetem
#    nese pershkrimi i tyre perputhet rastesisht me fjalet e perdoruesit. Me te,
#    agjenti e sheh listen e plote qe ne rreshtin e pare.
# 2. Siguron `node_modules` — pa to nuk xhirohen as testet as `next build`.
# 3. Lidh Chromium-in per shfletuesin e shikimit (Rregulli 11: verifikim live me
#    sy). Serveri MCP `playwright` e kerkon Chrome te /opt/google/chrome/chrome,
#    por mjedisi e ka te /opt/pw-browsers. Kjo e ben shfletuesin gati ne cdo
#    sesion. (Dalja e jashtme qeveriset nga politika e rrjetit e mjedisit — nese
#    hostet jane te bllokuar me 403, hapja e tyre behet te konfigurimi i mjedisit,
#    jo ketu.)
#
# Xhirohet ne cdo sesion; duhet te jete idempotent dhe pa nderveprim.
set -euo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
SKILLS="$ROOT/.claude/skills"

if [ -d "$SKILLS" ]; then
  names=$(find "$SKILLS" -mindepth 2 -maxdepth 2 -name SKILL.md -printf '%h\n' \
          | xargs -r -n1 basename | sort)
  count=$(printf '%s\n' "$names" | grep -c . || true)

  echo "## Skills ne kete repo ($count)"
  echo
  echo "Perpara se te nisesh nje detyre, shiko nese nje nga keto e mbulon. Nese po,"
  echo "thirre me Skill perpara se te shkruash kod — jo pasi ta kesh shkruar."
  echo "Nese asnje nuk pershtatet, vazhdo normalisht; mos e detyro."
  echo
  printf '%s\n' "$names" | paste -sd' ' -
  echo
  echo "Detajet e secilit: .claude/skills/<emri>/SKILL.md · burimet: .claude/skills/BURIMI.md"
  echo
  echo "task-observer thirret ne fillim te cdo sesioni pune (shih CLAUDE.md)."
  echo
fi

# Varesite: vetem nese mungojne. `npm install` mbi nje peme te plote eshte
# pothuajse pa kosto, por kontrolli e ben nisjen e sesionit te menjehershme.
if [ -f "$ROOT/package.json" ] && [ ! -d "$ROOT/node_modules" ]; then
  echo "node_modules mungonte — po instalohet..."
  (cd "$ROOT" && npm install --no-audit --no-fund >/dev/null 2>&1) \
    && echo "Varesite u instaluan." \
    || echo "KUJDES: npm install deshtoi. Testet dhe ndertimi nuk do te xhirojne."
fi

# Shfletuesi i shikimit: lidhje idempotente e Chromium-it te paketuar (glob mbi
# versionin, qe te mos varet nga chromium-1194). Kurre nuk e nderpret hook-un.
CHROMIUM="$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null | head -1 || true)"
if [ -n "${CHROMIUM:-}" ] && [ ! -e /opt/google/chrome/chrome ]; then
  ( mkdir -p /opt/google/chrome && ln -sf "$CHROMIUM" /opt/google/chrome/chrome ) 2>/dev/null \
    && echo "Chromium u lidh per shfletuesin e shikimit (verifikim live)." || true
fi
