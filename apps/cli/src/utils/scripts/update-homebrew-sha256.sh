#!/usr/bin/env bash
# Download release assets and print sha256 lines for homebrew/lomi.rb
# Usage: ./scripts/update-homebrew-sha256.sh 3.101.1
# If the GitHub release is not published yet, build locally and hash binaries:
#   cargo build --release
#   cp target/release/lomi /tmp/lomi-aarch64-apple-darwin
#   shasum -a 256 /tmp/lomi-aarch64-apple-darwin
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${1:?Usage: update-homebrew-sha256.sh <version>}"
TAG="cli-v${VERSION}"
BASE="https://github.com/lomiafrica/lomi./releases/download/${TAG}"

declare -A ASSETS=(
  [x86_64-apple-darwin]="lomi-x86_64-apple-darwin"
  [aarch64-apple-darwin]="lomi-aarch64-apple-darwin"
  [x86_64-unknown-linux-gnu]="lomi-x86_64-unknown-linux-gnu"
)

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Fetching release ${TAG}..."
echo

for key in "${!ASSETS[@]}"; do
  asset="${ASSETS[$key]}"
  url="${BASE}/${asset}"
  dest="${TMP}/${asset}"
  curl -sfL "$url" -o "$dest"
  sha="$(shasum -a 256 "$dest" | awk '{print $1}')"
  echo "${asset}: sha256 \"${sha}\""
done

echo
echo "Paste the matching sha256 values into apps/cli/homebrew/lomi.rb"
