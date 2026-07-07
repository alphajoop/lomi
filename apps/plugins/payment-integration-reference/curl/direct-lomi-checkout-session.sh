#!/usr/bin/env bash
set -euo pipefail

LOMI_BASE_URL="${LOMI_BASE_URL:-https://api.lomi.africa}"
LOMI_SECRET_KEY="${LOMI_SECRET_KEY:-}"

if [[ -z "${LOMI_SECRET_KEY}" ]]; then
  echo "LOMI_SECRET_KEY is required"
  exit 1
fi

curl -sS -X POST "${LOMI_BASE_URL}/checkout-sessions" \
  -H "x-api-key: ${LOMI_SECRET_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "currency_code": "XOF",
    "customer_email": "customer@example.com",
    "title": "Direct lomi API call",
    "success_url": "https://example.com/success",
    "cancel_url": "https://example.com/cancel"
  }' | jq
