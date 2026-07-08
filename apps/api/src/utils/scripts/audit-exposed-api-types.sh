#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

CONFIG="$API_ROOT/src/api-config.ts"
API_TS="$API_ROOT/src/utils/types/api.ts"
# The real consumer of the generated api.ts Database type is the whole API app: src + tests.
CORPUS=("$API_ROOT/src" "$API_ROOT/test")
EX=( -g '!**/api-config.ts' -g "!$API_ROOT/src/utils/types/api.ts" )

extract_list() {
  awk "/^export const $1 = \[/{f=1;next} /^];/{if(f){f=0}} f" "$CONFIG" \
    | sed -E "s/^[[:space:]]*'([^']+)',?.*/\1/" \
    | grep -E '^[a-z_]+$' || true
}

to_pascal() {
  echo "$1" | awk -F_ '{s="";for(i=1;i<=NF;i++){s=s toupper(substr($i,1,1)) substr($i,2)}; print s}'
}

echo "===================== EXPOSED FUNCTIONS not used anywhere in apps/api (src+test) ====================="
funcs=$(extract_list "EXPOSED_FUNCTIONS")
fcount=0; funused=0
while IFS= read -r fn; do
  [ -z "$fn" ] && continue
  fcount=$((fcount+1))
  files=$(rg -l --fixed-strings "$fn" "${CORPUS[@]}" "${EX[@]}" 2>/dev/null || true)
  if [ -z "$files" ]; then
    funused=$((funused+1))
    echo "UNUSED-IN-API  $fn"
  fi
done <<< "$funcs"
echo "-> functions total=$fcount unused-in-api=$funused"

echo ""
echo "===================== EXPOSED ENUMS analysis ====================="
echo "internal = APIEnums[enum] refs inside api.ts beyond own alias ; app = snake/Pascal refs in apps/api src+test"
enums=$(extract_list "EXPOSED_ENUMS")
ecount=0; eremove=0
while IFS= read -r en; do
  [ -z "$en" ] && continue
  ecount=$((ecount+1))
  apirefs=$(rg -oF "APIEnums[\"$en\"]" "$API_TS" 2>/dev/null | wc -l | tr -d ' ')
  internal=0; [ "$apirefs" -gt 0 ] && internal=$((apirefs-1))
  snake=$(rg -lw "$en" "${CORPUS[@]}" "${EX[@]}" 2>/dev/null | wc -l | tr -d ' ')
  pascal=$(to_pascal "$en")
  pfiles=$(rg -lw "$pascal" "${CORPUS[@]}" -g "!$API_ROOT/src/utils/types/api.ts" 2>/dev/null || true)
  pcount=0; [ -n "$pfiles" ] && pcount=$(echo "$pfiles" | wc -l | tr -d ' ')
  if [ "$internal" -eq 0 ] && [ "$snake" -eq 0 ] && [ "$pcount" -eq 0 ]; then
    eremove=$((eremove+1))
    printf "REMOVE?  %-34s internal=%s snake=%s pascal(%s)=%s\n" "$en" "$internal" "$snake" "$pascal" "$pcount"
  fi
done <<< "$enums"
echo "-> enums total=$ecount removable=$eremove"
