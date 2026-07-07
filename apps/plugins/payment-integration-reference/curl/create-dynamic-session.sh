#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"

curl -sS -X POST "${API_BASE_URL}/api/checkout/dynamic" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "currency_code": "XOF",
    "customer_email": "customer@example.com",
    "title": "Dynamic amount demo",
    "description": "Payment created via curl"
  }' | jq
