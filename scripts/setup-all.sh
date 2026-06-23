#!/usr/bin/env bash
# =============================================================
# ALPAZAR — One-shot setup script
# Run ONCE from your local machine (not CCR/cloud env)
# Usage: bash scripts/setup-all.sh
# =============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $*${NC}"; }
err()  { echo -e "${RED}❌ $*${NC}"; }
ask()  { read -r -p "$(echo -e "${YELLOW}👉 $1${NC}")" "$2"; }

PAT_REPO="likamartin23-source/alpazar"
VERCEL_PROJECT="prj_KNCEtuUDGNCA6ulHomdKniNAZEuX"
VERCEL_TEAM="team_Kkg5W4qnF2t5CQZj64ZS8xbz"

echo ""
echo "======================================================"
echo "  ALPAZAR — Setup Automatik i Çelësave & Aksesin"
echo "======================================================"
echo ""

# ── Step 1: Mblidh çelësat ──────────────────────────────────
echo "Hapi 1: Fut çelësat (shtypni Enter për të kaluar)"
echo "--------------------------------------------------------"
ask "GROQ_API_KEY       (console.groq.com/keys): " GROQ_API_KEY
ask "ANTHROPIC_API_KEY  (console.anthropic.com/settings/api-keys): " ANTHROPIC_API_KEY
ask "VERCEL_TOKEN       (vercel.com/account/tokens): " VERCEL_TOKEN
ask "GitHub PAT me scope workflow+secrets (github.com/settings/tokens): " GITHUB_PAT
ask "SLACK_WEBHOOK_URL  (slack.com → Apps → Incoming Webhooks) [opsionale]: " SLACK_WEBHOOK_URL
ask "ADMIN_PIN          (6 shifra, default 123456): " ADMIN_PIN
ADMIN_PIN="${ADMIN_PIN:-123456}"

echo ""

# ── Step 2: Vercel env vars ─────────────────────────────────
echo "Hapi 2: Vercel — Po vendos env vars..."
set_vercel_env() {
  local KEY="$1" VAL="$2"
  if [[ -z "$VAL" ]]; then warn "Kaloj $KEY (bosh)"; return; fi
  RES=$(curl -s -X POST \
    "https://api.vercel.com/v10/projects/${VERCEL_PROJECT}/env?teamId=${VERCEL_TEAM}&upsert=true" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"${KEY}\",\"value\":$(printf '%s' "$VAL" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'),\"type\":\"encrypted\",\"target\":[\"production\",\"preview\"]}")
  if echo "$RES" | python3 -c "import json,sys; d=json.load(sys.stdin); exit(0 if 'key' in d or (isinstance(d,list) and any('key' in x for x in d)) else 1)" 2>/dev/null; then
    ok "Vercel: $KEY"
  else
    err "Vercel $KEY: $(echo "$RES" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get(\"error\",{}).get(\"message\",str(d)))' 2>/dev/null || echo "$RES")"
  fi
}

if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  SUPABASE_URL="https://sopafwfkrxpcdaljddoh.supabase.co"
  SUPABASE_ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcGFmd2ZrcnhwY2RhbGpkZG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDk1MzgsImV4cCI6MjA5NDc4NTUzOH0.PS9_c8DdObZ-3NlGTWtj9awvtOpbgE-7b_fdGY4ICLY"
  set_vercel_env "GROQ_API_KEY"               "${GROQ_API_KEY:-}"
  set_vercel_env "ANTHROPIC_API_KEY"           "${ANTHROPIC_API_KEY:-}"
  set_vercel_env "ADMIN_PIN"                   "$ADMIN_PIN"
  set_vercel_env "NEXT_PUBLIC_SUPABASE_URL"    "$SUPABASE_URL"
  set_vercel_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON"
else
  warn "Pa VERCEL_TOKEN — kapërcij Vercel env vars"
fi

# ── Step 3: GitHub Secrets ──────────────────────────────────
echo ""
echo "Hapi 3: GitHub Secrets..."

encrypt_secret() {
  local PUB_KEY="$1" SECRET_VAL="$2"
  python3 - <<PYEOF
import base64, sys
from nacl.public import PublicKey, SealedBox
pub_key_bytes = base64.b64decode("${PUB_KEY}")
box = SealedBox(PublicKey(pub_key_bytes))
encrypted = box.encrypt(b"${SECRET_VAL}")
print(base64.b64encode(encrypted).decode())
PYEOF
}

set_github_secret() {
  local NAME="$1" VAL="$2"
  if [[ -z "$VAL" ]]; then warn "Kaloj GitHub secret $NAME (bosh)"; return; fi

  PUBKEY_RES=$(curl -s \
    "https://api.github.com/repos/${PAT_REPO}/actions/secrets/public-key" \
    -H "Authorization: Bearer ${GITHUB_PAT}" \
    -H "Accept: application/vnd.github+json")
  KEY_ID=$(echo "$PUBKEY_RES" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["key_id"])')
  PUB_KEY=$(echo "$PUBKEY_RES" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["key"])')

  ENCRYPTED=$(python3 - "$PUB_KEY" "$VAL" <<'PYEOF'
import base64, sys
from nacl.public import PublicKey, SealedBox
pub_key_bytes = base64.b64decode(sys.argv[1])
box = SealedBox(PublicKey(pub_key_bytes))
encrypted = box.encrypt(sys.argv[2].encode())
print(base64.b64encode(encrypted).decode())
PYEOF
)
  RES=$(curl -s -X PUT \
    "https://api.github.com/repos/${PAT_REPO}/actions/secrets/${NAME}" \
    -H "Authorization: Bearer ${GITHUB_PAT}" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    -d "{\"encrypted_value\":\"${ENCRYPTED}\",\"key_id\":\"${KEY_ID}\"}")
  if [[ -z "$RES" ]] || echo "$RES" | python3 -c 'import json,sys; d=json.load(sys.stdin); exit(0 if d.get("status")=="204" else 1)' 2>/dev/null || [[ $(echo "$RES" | wc -c) -lt 5 ]]; then
    ok "GitHub Secret: $NAME"
  else
    err "GitHub Secret $NAME: $(echo "$RES" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("message","?"))' 2>/dev/null || echo "$RES")"
  fi
}

if [[ -n "${GITHUB_PAT:-}" ]]; then
  SUPABASE_URL="https://sopafwfkrxpcdaljddoh.supabase.co"
  SUPABASE_ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcGFmd2ZrcnhwY2RhbGpkZG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDk1MzgsImV4cCI6MjA5NDc4NTUzOH0.PS9_c8DdObZ-3NlGTId9awvtOpbgE-7b_fdGY4ICLY"
  set_github_secret "ANTHROPIC_API_KEY"              "${ANTHROPIC_API_KEY:-}"
  set_github_secret "GROQ_API_KEY"                   "${GROQ_API_KEY:-}"
  set_github_secret "SLACK_WEBHOOK_URL"               "${SLACK_WEBHOOK_URL:-}"
  set_github_secret "NEXT_PUBLIC_SUPABASE_URL"        "$SUPABASE_URL"
  set_github_secret "NEXT_PUBLIC_SUPABASE_ANON_KEY"   "$SUPABASE_ANON"
  set_github_secret "ALPAZAR_CLAUD_SECRET"            "${GITHUB_PAT}"
else
  warn "Pa GITHUB_PAT — kapërcij GitHub Secrets"
fi

# ── Step 4: Push claude.yml (kërkon workflow scope) ─────────
echo ""
echo "Hapi 4: Push claude.yml me github_token..."
if [[ -n "${GITHUB_PAT:-}" ]]; then
  cd "$(dirname "$0")/.."
  # Shto github_token: nëse mungon
  if ! grep -q "github_token:" .github/workflows/claude.yml 2>/dev/null; then
    sed -i 's/          anthropic_api_key: \${{ secrets.ANTHROPIC_API_KEY }}/          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}\n          github_token: ${{ secrets.ALPAZAR_CLAUD_SECRET || secrets.GITHUB_TOKEN }}/' .github/workflows/claude.yml
    git add .github/workflows/claude.yml
    git commit -m "ci(claude): add github_token param to claude-code-action" 2>/dev/null || true
  fi
  git remote set-url pat-push "https://${GITHUB_PAT}@github.com/${PAT_REPO}.git" 2>/dev/null || git remote add pat-push "https://${GITHUB_PAT}@github.com/${PAT_REPO}.git"
  if git push pat-push HEAD:claude/loving-wright-kBMgT 2>&1 | grep -q "workflow"; then
    err "PAT nuk ka scope 'workflow' — shko te github.com/settings/tokens dhe shto atë scope"
  else
    ok "claude.yml u push"
    # Merge to main
    git push pat-push HEAD:main && ok "main u përditësua"
  fi
fi

# ── Step 5: Vercel redeploy ─────────────────────────────────
echo ""
echo "Hapi 5: Trigger Vercel redeploy..."
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  RES=$(curl -s -X POST \
    "https://api.vercel.com/v13/deployments?teamId=${VERCEL_TEAM}" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"alpazar\",\"deploymentId\":\"dpl_3m3zybRmhpqTnNJz3yQL7Ri1VnyQ\",\"target\":\"production\"}")
  NEW_ID=$(echo "$RES" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("id","?"))' 2>/dev/null)
  ok "Vercel redeploy: $NEW_ID"
fi

echo ""
echo "======================================================"
echo "  DONE! Alpazar është konfiguruar plotësisht."
echo "======================================================"
echo ""
echo "📋 Lista çelësat të vendosur:"
[[ -n "${GROQ_API_KEY:-}" ]]        && echo "  ✅ GROQ_API_KEY (Vercel + GitHub)"
[[ -n "${ANTHROPIC_API_KEY:-}" ]]   && echo "  ✅ ANTHROPIC_API_KEY (Vercel + GitHub)"
[[ -n "${SLACK_WEBHOOK_URL:-}" ]]   && echo "  ✅ SLACK_WEBHOOK_URL (GitHub Secret)"
[[ -n "${VERCEL_TOKEN:-}" ]]        && echo "  ✅ NEXT_PUBLIC_SUPABASE_* (Vercel)"
echo "  ✅ ALPAZAR_CLAUD_SECRET (GitHub Secret)"
echo ""
echo "🌐 Production: https://alpazar.vercel.app"
echo "📂 GitHub: https://github.com/${PAT_REPO}"
echo "🤖 Claude: https://claude.ai/code"
