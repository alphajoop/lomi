#!/usr/bin/env bash
# Sync CLI version across Cargo.toml, npm wrapper, and Homebrew formula.
# Usage: ./scripts/bump-version.sh 3.0.1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VERSION="${1:?Usage: bump-version.sh <version>}"

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  echo "Invalid semver: $VERSION" >&2
  exit 1
fi

# Cargo.toml (portable sed)
if sed --version >/dev/null 2>&1; then
  sed -i "s/^version = \".*\"/version = \"$VERSION\"/" "$ROOT/Cargo.toml"
  sed -i "s/^  version \".*\"/  version \"$VERSION\"/" "$ROOT/homebrew/lomi.rb"
  sed -i "s|/releases/download/cli-v[0-9.]*|/releases/download/cli-v$VERSION|g" "$ROOT/homebrew/lomi.rb"
else
  sed -i '' "s/^version = \".*\"/version = \"$VERSION\"/" "$ROOT/Cargo.toml"
  sed -i '' "s/^  version \".*\"/  version \"$VERSION\"/" "$ROOT/homebrew/lomi.rb"
  sed -i '' "s|/releases/download/cli-v[0-9.]*|/releases/download/cli-v$VERSION|g" "$ROOT/homebrew/lomi.rb"
fi

# npm wrapper
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('$ROOT/npm/package.json', 'utf8'));
pkg.version = '$VERSION';
fs.writeFileSync('$ROOT/npm/package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "Bumped to $VERSION in Cargo.toml, npm/package.json, and homebrew/lomi.rb"
echo "Remember to update sha256 checksums in homebrew/lomi.rb after the GitHub release is published:"
echo "  ./scripts/release/update-homebrew-sha256.sh $VERSION"
