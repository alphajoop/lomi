#!/usr/bin/env bash
# Initialize specific git submodules at the SHAs recorded in the superproject.
# Usage: bash .github/scripts/init-submodules.sh <path> [path...]
# Optional: REPO_CHECKOUT_PAT or TOKEN for private GitHub submodules.
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <submodule-path> [submodule-path...]" >&2
  exit 2
fi

root="$(git rev-parse --show-toplevel)"
cd "$root"

if [[ -n "${REPO_CHECKOUT_PAT:-${TOKEN:-}}" ]]; then
  token="${REPO_CHECKOUT_PAT:-$TOKEN}"
  git config url."https://x-access-token:${token}@github.com/".insteadOf "https://github.com/"
fi

url_for_path() {
  local path="$1" key value name
  while read -r key value; do
    if [[ "$value" == "$path" ]]; then
      name="${key#submodule.}"
      name="${name%.path}"
      git config -f .gitmodules --get "submodule.${name}.url"
      return 0
    fi
  done < <(git config -f .gitmodules --get-regexp '^submodule\..*\.path$')
  return 1
}

git submodule sync -- "$@"

if git -c protocol.version=1 submodule update --init --force --checkout -- "$@"; then
  exit 0
fi

echo "submodule update failed; fetching pinned SHAs directly" >&2

for path in "$@"; do
  sha="$(git rev-parse "HEAD:${path}")"
  url="$(url_for_path "$path")"
  if [[ -z "$url" ]]; then
    echo "error: no .gitmodules url for ${path}" >&2
    exit 1
  fi
  if [[ ! -e "${path}/.git" ]]; then
    mkdir -p "$(dirname "$path")"
    git clone --no-checkout "$url" "$path"
  fi
  git -C "$path" -c protocol.version=1 fetch --force origin "$sha"
  git -C "$path" checkout --force "$sha"
done
