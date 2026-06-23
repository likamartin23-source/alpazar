#!/usr/bin/env python3
"""
Set a GitHub Actions secret encrypted with the repo's public key.
Usage: python3 scripts/set-github-secret.py SECRET_NAME SECRET_VALUE GITHUB_PAT
"""
import sys, base64, json
from urllib import request as urllib_request
from urllib.error import HTTPError

def encrypt(pub_key_b64: str, secret_value: str) -> str:
    from nacl.public import PublicKey, SealedBox
    pub_key_bytes = base64.b64decode(pub_key_b64)
    box = SealedBox(PublicKey(pub_key_bytes))
    return base64.b64encode(box.encrypt(secret_value.encode())).decode()

def github_api(method: str, path: str, pat: str, body=None):
    url = f"https://api.github.com{path}"
    headers = {
        "Authorization": f"Bearer {pat}",
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
    }
    data = json.dumps(body).encode() if body else None
    req = urllib_request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib_request.urlopen(req) as resp:
            return json.loads(resp.read()) if resp.read() else {}
    except HTTPError as e:
        return json.loads(e.read())

OWNER = "likamartin23-source"
REPO = "alpazar"

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python3 set-github-secret.py NAME VALUE PAT")
        sys.exit(1)

    name, value, pat = sys.argv[1], sys.argv[2], sys.argv[3]

    pk = github_api("GET", f"/repos/{OWNER}/{REPO}/actions/secrets/public-key", pat)
    if "key" not in pk:
        print(f"❌ Cannot get public key: {pk}")
        sys.exit(1)

    encrypted = encrypt(pk["key"], value)
    res = github_api("PUT", f"/repos/{OWNER}/{REPO}/actions/secrets/{name}", pat,
                     {"encrypted_value": encrypted, "key_id": pk["key_id"]})
    if not res or res.get("message") is None:
        print(f"✅ Secret '{name}' set successfully")
    else:
        print(f"❌ Error: {res}")
