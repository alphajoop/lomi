#!/usr/bin/env bash
set -euo pipefail

LOMI_BASE_URL="${LOMI_BASE_URL:-https://sandbox.api.lomi.africa}"
LOMI_SECRET_KEY="${LOMI_SECRET_KEY:?Set LOMI_SECRET_KEY}"

curl -sS -X POST "${LOMI_BASE_URL}/charge/card" \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: ${LOMI_SECRET_KEY}" \
  -d '{
    "amount": 10000,
    "currency_code": "XOF",
    "customer_email": "buyer@example.com",
    "customer_name": "Buyer Name",
    "description": "Direct card charge via curl",
    "appearance_theme": "light",
    "appearance_border_radius": 6,
    "appearance_billing_address": "never"
  }' | jq
