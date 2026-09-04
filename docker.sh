#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DOMAIN="sms.site"
ACTION="${1:-}"
shift || true

case "${OSTYPE:-}" in
  msys*|cygwin*) HOSTS_FILE="/c/Windows/System32/drivers/etc/hosts" ;;
  *) HOSTS_FILE="/etc/hosts" ;;
esac

add_hosts_entry() {
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
}

remove_hosts_entry() {
  if grep -qs "[[:space:]]${DOMAIN}$" "$HOSTS_FILE" 2>/dev/null; then
    echo "[hosts] Xoa ${DOMAIN} khoi ${HOSTS_FILE} ..."
    if sed -i.bak "/[[:space:]]${DOMAIN}$/d" "$HOSTS_FILE" 2>/dev/null; then
      rm -f "${HOSTS_FILE}.bak"
      echo "[hosts] Da xoa."
    else
      echo "[hosts] Khong the ghi vao ${HOSTS_FILE} (can quyen admin/sudo)."
    fi
  fi
}

usage() {
  echo "Usage: ./docker.sh up [docker compose up args...]"
  echo "       ./docker.sh down [docker compose down args...]"
  echo "       PURGE_HOSTS=1 ./docker.sh down   # also removes ${DOMAIN} from hosts"
}

case "$ACTION" in
  up)
    add_hosts_entry
    echo "[docker] Building va khoi dong cac container..."
    docker compose up --build "$@"
    ;;
  down)
    echo "[docker] Dung va xoa cac container..."
    docker compose down "$@"
    if [ "${PURGE_HOSTS:-0}" = "1" ]; then
      remove_hosts_entry
    else
      echo "[hosts] Giu nguyen ${DOMAIN} trong hosts (khong anh huong gi khi container da tat)."
      echo "[hosts] Muon xoa luon, chay: PURGE_HOSTS=1 ./docker.sh down"
    fi
    ;;
  *)
    usage
    exit 1
    ;;
esac
