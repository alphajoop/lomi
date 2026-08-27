#!/usr/bin/env bash
# Publish a package directory to npm when that exact version is not on the registry.
# Strips file:/workspace: deps so a tarball never points at private monorepo packages.
# Fails if built JS still imports private @lomi./shared (vendor those helpers first).
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: npm-publish-if-new.sh <package-dir>" >&2
  exit 2
fi

DIR="$1"
cd "$DIR"

NAME="$(node -p "require('./package.json').name")"
VER="$(node -p "require('./package.json').version")"

if npm view "${NAME}@${VER}" version >/dev/null 2>&1; then
  echo "${NAME}@${VER} already on npm"
  exit 0
fi

node --input-type=commonjs <<'NODE'
const fs = require("node:fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
let changed = false;
for (const field of [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
]) {
  const bag = pkg[field];
  if (!bag) continue;
  for (const [key, value] of Object.entries(bag)) {
    const spec = String(value);
    if (spec.startsWith("file:") || spec.startsWith("workspace:")) {
      delete bag[key];
      changed = true;
    }
  }
}
if (changed) {
  fs.writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
}
NODE

if [[ -d dist ]] && grep -R --quiet '@lomi\./shared' dist; then
  echo "dist still imports private @lomi./shared; vendor helpers before publishing ${NAME}" >&2
  exit 1
fi

npm publish --access public
echo "published ${NAME}@${VER}"
