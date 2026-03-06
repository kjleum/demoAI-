#!/usr/bin/env bash
set -euo pipefail

# Simple production deploy helper for ai-platform-repo-v2
# Usage:
#   DOMAIN=app.example.com EMAIL=ops@example.com POSTGRES_PASSWORD='strong_password' ./scripts/deploy_vps.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy"
BACKEND_ENV="$ROOT_DIR/backend/.env"
DEPLOY_ENV="$DEPLOY_DIR/.env"

required() {
  local var_name="$1"
  if [[ -z "${!var_name:-}" ]]; then
    echo "[ERROR] Missing required env var: $var_name"
    exit 1
  fi
}

required DOMAIN
required EMAIL
required POSTGRES_PASSWORD

if ! command -v docker >/dev/null 2>&1; then
  echo "[ERROR] docker is not installed"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "[ERROR] docker compose plugin is not available"
  exit 1
fi

mkdir -p "$ROOT_DIR/backend" "$DEPLOY_DIR"

if [[ ! -f "$BACKEND_ENV" ]]; then
  cp "$ROOT_DIR/backend/.env.example" "$BACKEND_ENV"
fi

JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
ENCRYPTION_KEY="${ENCRYPTION_KEY:-$(python - <<'PY'
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
PY
)}"

# Update critical backend vars (idempotent)
python - <<PY
from pathlib import Path
p = Path(r"$BACKEND_ENV")
text = p.read_text()
updates = {
    "JWT_SECRET": r"$JWT_SECRET",
    "ENCRYPTION_KEY": r"$ENCRYPTION_KEY",
    "CORS_ORIGINS": "https://$DOMAIN"
}
lines = []
seen = set()
for line in text.splitlines():
    if "=" in line and not line.strip().startswith("#"):
        k, _ = line.split("=", 1)
        k = k.strip()
        if k in updates:
            lines.append(f"{k}={updates[k]}")
            seen.add(k)
            continue
    lines.append(line)
for k, v in updates.items():
    if k not in seen:
        lines.append(f"{k}={v}")
p.write_text("\n".join(lines) + "\n")
PY

cat > "$DEPLOY_ENV" <<ENV
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
DOMAIN=${DOMAIN}
EMAIL=${EMAIL}
ENV

cd "$DEPLOY_DIR"
docker compose -f docker-compose.prod.yml up -d --build

echo "[OK] Deployed. Check:"
echo "  https://${DOMAIN}"
echo "  https://${DOMAIN}/api/v1/health"
