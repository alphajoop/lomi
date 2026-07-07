#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:3002}"

curl -sS -X POST "${API_BASE_URL}/api/charge/card" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "currency_code": "XOF",
    "customer_email": "buyer@example.com",
    "customer_name": "Buyer Name"
  }' | jq
