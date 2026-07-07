#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
PRICE_ID="${PRICE_ID:-replace-with-real-price-id}"

curl -sS -X POST "${API_BASE_URL}/api/checkout/price" \
  -H "Content-Type: application/json" \
  -d "{
    \"price_id\": \"${PRICE_ID}\",
    \"quantity\": 1,
    \"customer_email\": \"customer@example.com\",
    \"title\": \"Price-led demo\",
    \"description\": \"Payment created via curl\"
  }" | jq
