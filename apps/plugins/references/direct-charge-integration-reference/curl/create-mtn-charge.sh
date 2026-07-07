#!/usr/bin/env bash
set -euo pipefail

LOMI_BASE_URL="${LOMI_BASE_URL:-https://sandbox.api.lomi.africa}"
LOMI_SECRET_KEY="${LOMI_SECRET_KEY:?Set LOMI_SECRET_KEY}"

curl -sS -X POST "${LOMI_BASE_URL}/charge/mtn" \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: ${LOMI_SECRET_KEY}" \
  -d '{
    "amount": 1000,
    "currency": "XOF",
    "customer": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phoneNumber": "+2250707070707"
    },
    "description": "Direct MTN charge via curl",
    "countryCode": "CI",
    "quantity": 1
  }' | jq
