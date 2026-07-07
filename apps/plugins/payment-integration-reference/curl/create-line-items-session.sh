#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
PRICE_ID_1="${PRICE_ID_1:-replace-with-price-id-1}"
PRICE_ID_2="${PRICE_ID_2:-replace-with-price-id-2}"

curl -sS -X POST "${API_BASE_URL}/api/checkout/line-items" \
  -H "Content-Type: application/json" \
  -d "{
    \"currency_code\": \"XOF\",
    \"customer_email\": \"customer@example.com\",
    \"line_items\": [
      { \"price_id\": \"${PRICE_ID_1}\", \"quantity\": 1 },
      { \"price_id\": \"${PRICE_ID_2}\", \"quantity\": 2 }
    ],
    \"title\": \"Line-items demo\",
    \"description\": \"Payment created via curl\"
  }" | jq
