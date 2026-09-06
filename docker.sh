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
    echo "[hosts] ${DOMAIN} is already in ${HOSTS_FILE}"
  else
    echo "[hosts] Adding ${DOMAIN} -> 127.0.0.1 to ${HOSTS_FILE} ..."
    if echo "127.0.0.1 ${DOMAIN}" >> "$HOSTS_FILE" 2>/dev/null; then
      echo "[hosts] Added successfully."
    else
      echo "[hosts] Could not write to ${HOSTS_FILE} (needs admin/sudo)."
      echo "[hosts] Re-run the script with admin rights, or add this line yourself:"
      echo "        127.0.0.1 ${DOMAIN}"
    fi
  fi
}

remove_hosts_entry() {
  if grep -qs "[[:space:]]${DOMAIN}$" "$HOSTS_FILE" 2>/dev/null; then
    echo "[hosts] Removing ${DOMAIN} from ${HOSTS_FILE} ..."
    if sed -i.bak "/[[:space:]]${DOMAIN}$/d" "$HOSTS_FILE" 2>/dev/null; then
      rm -f "${HOSTS_FILE}.bak"
      echo "[hosts] Removed."
    else
      echo "[hosts] Could not write to ${HOSTS_FILE} (needs admin/sudo)."
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
    echo "[docker] Building and starting the containers..."
    docker compose up --build "$@"
    ;;
  down)
    echo "[docker] Stopping and removing the containers..."
    docker compose down "$@"
    if [ "${PURGE_HOSTS:-0}" = "1" ]; then
      remove_hosts_entry
    else
      echo "[hosts] Keeping ${DOMAIN} in hosts (harmless once the containers are stopped)."
      echo "[hosts] To remove it too, run: PURGE_HOSTS=1 ./docker.sh down"
    fi
    ;;
  *)
    usage
    exit 1
    ;;
esac
