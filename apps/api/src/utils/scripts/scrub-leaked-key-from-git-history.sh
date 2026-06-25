#!/usr/bin/env bash
# Remove apps/api/verify_charge.ts (leaked lomi_sk_...) from entire git history.
# Requires: git filter-repo (brew install git-filter-repo)
#
# After running:
#   1. Force-push all branches that contained the secret (coordinate with the team).
#   2. Ask GitHub to purge cached objects if the repo was public when committed.
#   3. Confirm the key is revoked in production (migration 20250625180000_*).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "Install git-filter-repo first: brew install git-filter-repo"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Commit or stash working tree changes before rewriting history."
  exit 1
fi

echo "Rewriting history to drop apps/api/verify_charge.ts ..."
git filter-repo --force --path apps/api/verify_charge.ts --invert-paths

echo
echo "Done. Next steps:"
echo "  git push --force --all"
echo "  git push --force --tags"
echo "  Rotate/revoke the leaked key in every environment (see Supabase migration)."
