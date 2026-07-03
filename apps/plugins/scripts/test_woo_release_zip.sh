#!/usr/bin/env bash
# Build (optional) and validate the WooCommerce release zip structure.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WOO_DIR="${WOO_DIR:-$(cd "${SCRIPT_DIR}/../woo" && pwd)}"
RUN_RELEASE="${RUN_RELEASE:-1}"

log() {
  printf "[%s] %s\n" "$(date +'%H:%M:%S')" "$1"
}

if [[ ! -f "${WOO_DIR}/woo-lomi.php" ]]; then
  echo "FAIL: woo-lomi.php not found at ${WOO_DIR}/woo-lomi.php (initialize woo submodule?)"
  exit 1
fi

if [[ "${RUN_RELEASE}" == "1" ]]; then
  log "Building Woo release zip"
  bash "${WOO_DIR}/scripts/release.sh"
fi

DIST_DIR="${WOO_DIR}/dist"
ZIP_PATH="${DIST_DIR}/woo-lomi.zip"
if [[ ! -f "${ZIP_PATH}" ]]; then
  ZIP_PATH="$(find "${DIST_DIR}" -maxdepth 1 -name 'woo-lomi-*.zip' -type f | head -1 || true)"
fi

if [[ -z "${ZIP_PATH}" || ! -f "${ZIP_PATH}" ]]; then
  echo "FAIL: no release zip found under ${DIST_DIR}"
  exit 1
fi

log "Validating ${ZIP_PATH}"

if ! command -v unzip >/dev/null 2>&1; then
  echo "FAIL: unzip is required to inspect the release archive"
  exit 1
fi

LISTING="$(unzip -l "${ZIP_PATH}")"

require_entry() {
  local pattern="$1"
  local label="$2"
  if ! printf '%s\n' "${LISTING}" | grep -qE "${pattern}"; then
    echo "FAIL: zip missing ${label}"
    exit 1
  fi
}

require_entry 'woo-lomi/woo-lomi\.php' 'woo-lomi/woo-lomi.php'
require_entry 'woo-lomi/includes/' 'woo-lomi/includes/'
require_entry 'woo-lomi/assets/' 'woo-lomi/assets/'

if printf '%s\n' "${LISTING}" | grep -q 'node_modules'; then
  echo "FAIL: zip must not contain node_modules"
  exit 1
fi

if printf '%s\n' "${LISTING}" | grep -qE 'woo-lomi/(resources|dist)/'; then
  echo "FAIL: zip must not contain resources/ or dist/ build trees"
  exit 1
fi

log "PASS: Woo release zip structure (${ZIP_PATH})"
