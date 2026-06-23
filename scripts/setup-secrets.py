#!/usr/bin/env python3
"""
Vendos të gjitha GitHub Secrets dhe Vercel Env Vars për Alpazar.
Kërkon: pip install pynacl

Përdorim:
  python3 scripts/setup-secrets.py \
    --gh-pat  GITHUB_PAT \
    --vc-tok  VERCEL_TOKEN \
    --anthropic YOUR_ANTHROPIC_API_KEY \
    --groq      YOUR_GROQ_API_KEY \
    [--slack   YOUR_SLACK_WEBHOOK_URL] \
    [--admin-pin 123456]
"""
import sys, base64, json, argparse
from urllib import request as ur
from urllib.error import HTTPError

GH_OWNER   = "likamartin23-source"
GH_REPO    = "alpazar"
VC_PROJECT = "prj_KNCEtuUDGNCA6ulHomdKniNAZEuX"
VC_TEAM    = "team_Kkg5W4qnF2t5CQZj64ZS8xbz"

SUPABASE_URL      = "https://sopafwfkrxpcdaljddoh.supabase.co"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcGFmd2ZrcnhwY2RhbGpkZG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDk1MzgsImV4cCI6MjA5NDc4NTUzOH0"
    ".PS9_c8DdObZ-3NlGTWtj9awvtOpbgE-7b_fdGY4ICLY"
)


# ── helpers ────────────────────────────────────────────────────────────────

def gh_api(method, path, pat, body=None):
    req = ur.Request(
        f"https://api.github.com{path}",
        data=json.dumps(body).encode() if body else None,
        headers={
            "Authorization": f"Bearer {pat}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        method=method,
    )
    try:
        with ur.urlopen(req, timeout=15) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except HTTPError as e:
        raw = e.read()
        try:
            return json.loads(raw)
        except Exception:
            return {"error": e.code, "raw": raw.decode(errors="replace")}


def vc_api(method, path, tok, body=None):
    req = ur.Request(
        f"https://api.vercel.com{path}",
        data=json.dumps(body).encode() if body else None,
        headers={
            "Authorization": f"Bearer {tok}",
            "Content-Type": "application/json",
        },
        method=method,
    )
    try:
        with ur.urlopen(req, timeout=15) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except HTTPError as e:
        raw = e.read()
        try:
            return json.loads(raw)
        except Exception:
            return {"error": e.code, "raw": raw.decode(errors="replace")}


def encrypt_secret(pub_key_b64: str, value: str) -> str:
    from nacl.public import PublicKey, SealedBox
    box = SealedBox(PublicKey(base64.b64decode(pub_key_b64)))
    return base64.b64encode(box.encrypt(value.encode())).decode()


# ── GitHub Secrets ─────────────────────────────────────────────────────────

def set_gh_secret(name, value, pat, pub_key, key_id):
    enc = encrypt_secret(pub_key, value)
    res = gh_api("PUT", f"/repos/{GH_OWNER}/{GH_REPO}/actions/secrets/{name}", pat,
                 {"encrypted_value": enc, "key_id": key_id})
    if "message" in res and res["message"] != "":
        print(f"  ❌ {name}: {res}")
    else:
        print(f"  ✅ {name}")


def set_all_gh_secrets(pat, anthropic, groq, slack, admin_pin):
    print("\n── GitHub Secrets ──────────────────────────────────")
    pk = gh_api("GET", f"/repos/{GH_OWNER}/{GH_REPO}/actions/secrets/public-key", pat)
    if "key" not in pk:
        print(f"  ❌ Cannot get public key: {pk}")
        return False

    pub_key = pk["key"]
    key_id  = pk["key_id"]

    secrets = {
        "ALPAZAR_CLAUD_SECRET":       pat,
        "NEXT_PUBLIC_SUPABASE_URL":   SUPABASE_URL,
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": SUPABASE_ANON_KEY,
        "ANTHROPIC_API_KEY":          anthropic,
        "GROQ_API_KEY":               groq,
    }
    if slack:
        secrets["SLACK_WEBHOOK_URL"] = slack

    for name, val in secrets.items():
        if val:
            set_gh_secret(name, val, pat, pub_key, key_id)
        else:
            print(f"  ⏭  {name} (skipped — empty)")
    return True


# ── Vercel Env Vars ────────────────────────────────────────────────────────

def set_vc_env(key, value, tok, targets=None):
    if targets is None:
        targets = ["production", "preview", "development"]
    body = {"key": key, "value": value, "type": "encrypted", "target": targets}
    # try create first, if conflict (409) delete+recreate
    res = vc_api("POST",
                 f"/v10/projects/{VC_PROJECT}/env?teamId={VC_TEAM}",
                 tok, body)
    if res.get("error", {}).get("code") == "ENV_ALREADY_EXISTS" or \
       (isinstance(res.get("error"), dict) and "already" in str(res.get("error", "")).lower()):
        # delete existing then recreate
        envs = vc_api("GET", f"/v10/projects/{VC_PROJECT}/env?teamId={VC_TEAM}", tok)
        for e in (envs.get("envs") or []):
            if e.get("key") == key:
                vc_api("DELETE",
                       f"/v10/projects/{VC_PROJECT}/env/{e['id']}?teamId={VC_TEAM}",
                       tok)
        res = vc_api("POST",
                     f"/v10/projects/{VC_PROJECT}/env?teamId={VC_TEAM}",
                     tok, body)

    if "id" in res or "created" in str(res):
        print(f"  ✅ {key}")
    elif isinstance(res, list) and res:
        print(f"  ✅ {key}")
    else:
        print(f"  ❌ {key}: {res}")


def set_all_vc_envs(tok, anthropic, groq, admin_pin):
    print("\n── Vercel Env Vars ─────────────────────────────────")
    envs = {
        "NEXT_PUBLIC_SUPABASE_URL":      SUPABASE_URL,
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": SUPABASE_ANON_KEY,
        "ANTHROPIC_API_KEY":             anthropic,
        "GROQ_API_KEY":                  groq,
        "ADMIN_PIN":                     admin_pin,
    }
    for key, val in envs.items():
        if val:
            set_vc_env(key, val, tok)
        else:
            print(f"  ⏭  {key} (skipped — empty)")


# ── Vercel redeploy ────────────────────────────────────────────────────────

def trigger_redeploy(tok):
    print("\n── Vercel Redeploy ─────────────────────────────────")
    # Get latest deployment SHA and redeploy
    proj = vc_api("GET", f"/v9/projects/{VC_PROJECT}?teamId={VC_TEAM}", tok)
    dep = (proj.get("latestDeployments") or [{}])[0] if proj.get("latestDeployments") else {}
    git_sha = dep.get("meta", {}).get("githubCommitSha", "")
    if not git_sha:
        print("  ⚠ Could not find latest SHA — skipping redeploy trigger")
        return
    res = vc_api("POST", f"/v13/deployments?teamId={VC_TEAM}", tok, {
        "name": "alpazar",
        "gitSource": {
            "type": "github",
            "org": GH_OWNER,
            "repo": GH_REPO,
            "ref": "main",
        },
        "projectId": VC_PROJECT,
        "target": "production",
    })
    if res.get("id"):
        print(f"  ✅ Deployment triggered: {res['id']}")
    else:
        print(f"  ⚠ {res}")


# ── main ───────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--gh-pat",    required=True,  help="GitHub PAT (needs secrets + contents + workflow scope)")
    p.add_argument("--vc-tok",    required=True,  help="Vercel token")
    p.add_argument("--anthropic", required=False, default="", help="ANTHROPIC_API_KEY")
    p.add_argument("--groq",      required=False, default="", help="GROQ_API_KEY")
    p.add_argument("--slack",     required=False, default="", help="SLACK_WEBHOOK_URL (optional)")
    p.add_argument("--admin-pin", required=False, default="123456", help="ADMIN_PIN (default 123456)")
    args = p.parse_args()

    set_all_gh_secrets(args.gh_pat, args.anthropic, args.groq, args.slack, args.admin_pin)
    set_all_vc_envs(args.vc_tok, args.anthropic, args.groq, args.admin_pin)
    trigger_redeploy(args.vc_tok)
    print("\n✅ Done.")


if __name__ == "__main__":
    main()
