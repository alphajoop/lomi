#!/usr/bin/env bash
set -euo pipefail

CONNECTOR_URL="${CONNECTOR_URL:-http://localhost:3010}"

curl -sS -X POST "${CONNECTOR_URL}/api/v1/fees/charge" \
  -H "Content-Type: application/json" \
  -d '{
    "rail": "mtn",
    "amount": 25000,
    "payment_reference": "FEE-2026-TERM1-00042",
    "school_id": "school_pilot_001",
    "student_id": "STU-8842",
    "fee_code": "TUITION_TERM1",
    "term_id": "2026-T1",
    "customer_name": "Aminata Diallo",
    "customer_email": "parent@example.com",
    "customer_phone": "+2250707070707"
  }' | jq
