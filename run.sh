#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DOMAIN="sms.site"

case "${OSTYPE:-}" in
  msys*|cygwin*) HOSTS_FILE="/c/Windows/System32/drivers/etc/hosts" ;;
  *) HOSTS_FILE="/etc/hosts" ;;
esac

if grep -qs "[[:space:]]${DOMAIN}$" "$HOSTS_FILE" 2>/dev/null; then
  echo "[hosts] ${DOMAIN} da co trong ${HOSTS_FILE}"
else
  echo "[hosts] Them ${DOMAIN} -> 127.0.0.1 vao ${HOSTS_FILE} ..."
  if echo "127.0.0.1 ${DOMAIN}" >> "$HOSTS_FILE" 2>/dev/null; then
    echo "[hosts] Da them thanh cong."
  else
    echo "[hosts] Khong the ghi vao ${HOSTS_FILE} (can quyen admin/sudo)."
    echo "[hosts] Hay chay lai script voi quyen admin, hoac tu them dong sau:"
    echo "        127.0.0.1 ${DOMAIN}"
  fi
fi

echo "[docker] Building va khoi dong cac container..."
docker compose up --build "$@"
