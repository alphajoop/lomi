#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE_ROOT="$(cd "$API_ROOT/../.." && pwd)"

CONFIG="$API_ROOT/src/api-config.ts"
DBT="$WORKSPACE_ROOT/apps/dashboard/src/lib/types/database.types.ts"

extract_list() {
  awk "/^export const $1 = \[/{f=1;next} /^];/{if(f){f=0}} f" "$CONFIG" \
    | sed -E "s/^[[:space:]]*'([^']+)',?.*/\1/" \
    | grep -E '^[a-z_]+$' || true
}

# Extract the public.Functions section names from database.types.ts (second Functions block)
echo "### Exposed functions NOT present in dashboard database.types.ts Functions section ###"
funcs=$(extract_list EXPOSED_FUNCTIONS)
while IFS= read -r fn; do
  [ -z "$fn" ] && continue
  # look for "      fn: {" style definition (10+ spaces indent inside Functions)
  if ! rg -q "^\s+${fn}: \{" "$DBT" 2>/dev/null; then
    echo "MISSING  $fn"
  fi
done <<< "$funcs"

echo ""
echo "### duplicate entries in EXPOSED_FUNCTIONS (if any) ###"
extract_list EXPOSED_FUNCTIONS | sort | uniq -d
echo "### total lines vs unique ###"
extract_list EXPOSED_FUNCTIONS | wc -l
extract_list EXPOSED_FUNCTIONS | sort -u | wc -l
