#!/usr/bin/env python3
"""Register or update Authentik as GoTrue custom OIDC provider custom:authentik."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from urllib.parse import urlparse

AUTH = "http://auth:9999"
# GoTrue 2.189 requires the custom: prefix on create (it does not auto-prefix).
IDENTIFIER = "custom:authentik"
PROVIDER_PATH = f"/admin/custom-providers/{IDENTIFIER}"


def env_flag(name: str) -> bool:
    return os.environ.get(name, "").lower() in ("1", "true", "yes")


def request(method: str, path: str, body: dict | None = None) -> tuple[int, dict | str]:
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        AUTH + path,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {os.environ['SERVICE_ROLE_KEY']}",
            "apikey": os.environ["SERVICE_ROLE_KEY"],
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            return exc.code, json.loads(raw) if raw else raw
        except json.JSONDecodeError:
            return exc.code, raw


def authentik_oauth2_urls(issuer: str) -> dict[str, str]:
    parsed = urlparse(issuer)
    base = f"{parsed.scheme}://{parsed.netloc}/application/o"
    return {
        "authorization_url": f"{base}/authorize/",
        "token_url": f"{base}/token/",
        "userinfo_url": f"{base}/userinfo/",
    }


def main() -> int:
    if not env_flag("AUTHENTIK_ENABLED"):
        print("Authentik disabled; skip provider registration.")
        return 0

    for key in ("AUTHENTIK_CLIENT_ID", "AUTHENTIK_SECRET", "AUTHENTIK_URL", "SERVICE_ROLE_KEY"):
        if not os.environ.get(key):
            print(f"missing {key}", file=sys.stderr)
            return 1

    issuer = os.environ["AUTHENTIK_URL"].rstrip("/") + "/"
    oidc_body = {
        "provider_type": "oidc",
        "identifier": IDENTIFIER,  # must be custom:…
        "name": "Authentik",
        "client_id": os.environ["AUTHENTIK_CLIENT_ID"],
        "client_secret": os.environ["AUTHENTIK_SECRET"],
        "issuer": issuer,
        "scopes": ["openid", "email", "profile"],
        "enabled": True,
        "pkce_enabled": True,
    }
    update_body = {
        "client_id": oidc_body["client_id"],
        "client_secret": oidc_body["client_secret"],
        "issuer": issuer,
        "enabled": True,
        "scopes": oidc_body["scopes"],
    }

    code, payload = request("GET", PROVIDER_PATH)
    if code == 200:
        code, payload = request("PUT", PROVIDER_PATH, update_body)
        action = "updated"
    elif code == 404:
        code, payload = request("POST", "/admin/custom-providers", oidc_body)
        action = "created"
        if code == 400:
            # Discovery/SSRF can fail from inside the compose network; Authentik
            # advertise shared /application/o/{authorize,token,userinfo} URLs.
            print(f"OIDC create failed ({payload}); falling back to OAuth2 endpoints.")
            oauth2_body = {
                **{k: v for k, v in oidc_body.items() if k != "issuer"},
                "provider_type": "oauth2",
                **authentik_oauth2_urls(issuer),
            }
            code, payload = request("POST", "/admin/custom-providers", oauth2_body)
    else:
        print(f"GET {PROVIDER_PATH} failed: {code} {payload}", file=sys.stderr)
        return 1

    if code not in (200, 201):
        print(f"failed to register Authentik ({action}): {code} {payload}", file=sys.stderr)
        return 1

    print(f"Authentik provider {action}: {IDENTIFIER}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
