#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-replace-with-verification-token}"

PAYLOAD='{
  "id": "evt_test_001",
  "event": "PAYMENT_SUCCEEDED",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "data": {
    "transaction_id": "txn_test_001",
    "organization_id": "org_test_001",
    "amount": 10000,
    "currency_code": "XOF",
    "status": "completed"
  }
}'

SIGNATURE=$(printf "%s" "${PAYLOAD}" | openssl dgst -sha256 -hmac "${WEBHOOK_SECRET}" -hex | awk '{print $2}')

curl -sS -X POST "${API_BASE_URL}/api/webhooks/lomi" \
  -H "Content-Type: application/json" \
  -H "X-Lomi-Event: PAYMENT_SUCCEEDED" \
  -H "X-Lomi-Signature: ${SIGNATURE}" \
  -d "${PAYLOAD}" | jq
