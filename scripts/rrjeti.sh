#!/bin/bash
# Mat cfare arrin dot nje sesion i largët, dhe cfare jo.
#
# Ne Claude Code on the web, dalja HTTPS kalon nga nje proxy politikash. Nese
# hosti nuk eshte ne allowlist-in e mjedisit, gateway-i pergjigjet 403 ne
# CONNECT. Kjo NUK eshte gabim celesi dhe nuk rregullohet dot nga kodi:
# rregullohet te claude.ai -> Code -> Environments -> Network access.
#
# Xhirohet: bash scripts/rrjeti.sh
set -uo pipefail

prove() {
  local host="$1" pse="$2" out
  out=$(curl -sS -o /dev/null -m 12 -w '%{http_code}' "https://$host/" 2>&1)
  if printf '%s' "$out" | grep -qiE '403|CONNECT tunnel failed'; then
    printf '  ❌ %-44s BLLOKUAR    %s\n' "$host" "$pse"
  elif printf '%s' "$out" | grep -qE '^[1-5][0-9][0-9]$'; then
    printf '  ✅ %-44s HTTP %-6s %s\n' "$host" "$out" "$pse"
  else
    printf '  ⚠️  %-44s %s\n' "$host" "$(printf '%s' "$out" | head -c 50)"
  fi
}

echo "== Infrastruktura jone =="
prove sopafwfkrxpcdaljddoh.supabase.co       "baza e prodhimit"
prove alpazar.vercel.app                     "sajti"
prove o4511440664723456.ingest.de.sentry.io  "Sentry"

echo
echo "== Servera MCP lokale (.mcp.json) =="
prove api.firecrawl.dev "firecrawl"

echo
echo "== Sherbime te palit te trete qe i therret kodi =="
prove api.cloudinary.com          "video/foto"
prove api.brevo.com               "email"
prove api.resend.com              "email"
prove nominatim.openstreetmap.org "gjeokodim"

echo
echo "== Duhet te punojne gjithmone (lista e parazgjedhur 'Trusted') =="
prove api.github.com            "GitHub API"
prove raw.githubusercontent.com "skedare"

echo
echo "== Deshtimet e fundit te regjistruara nga proxy-ja =="
curl -sS "${HTTPS_PROXY:-http://127.0.0.1:35481}/__agentproxy/status" 2>/dev/null \
  | python3 -c '
import json,sys,collections
try: d=json.load(sys.stdin)
except Exception: print("  (statusi i proxy-se s'"'"'lexohet)"); sys.exit()
c=collections.Counter(x["host"] for x in d.get("recentRelayFailures",[]))
print("  (asnje)" if not c else "\n".join(f"  {h}  ×{n}" for h,n in c.most_common()))
'
