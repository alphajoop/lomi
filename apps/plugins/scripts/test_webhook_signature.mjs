#!/usr/bin/env node
/**
 * Contract test: lomi. webhook signatures use HMAC-SHA256 over the raw body, hex-encoded.
 * Reference apps and platform plugins must implement the same algorithm.
 */
import crypto from "node:crypto";
import assert from "node:assert/strict";

function signWebhook(rawBody, secret) {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

function verifyWebhook(rawBody, signature, secret) {
  const expected = signWebhook(rawBody, secret);
  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
}

const secret = "whsec_test_contract_secret";
const payload = JSON.stringify({
  event: "PAYMENT_SUCCEEDED",
  data: { checkout_session_id: "cs_test_123", amount: 5000, currency: "XOF" },
});

const signature = signWebhook(payload, secret);

assert.equal(signature.length, 64, "HMAC-SHA256 hex digest must be 64 chars");
assert.match(signature, /^[0-9a-f]+$/, "signature must be lowercase hex");
assert.ok(verifyWebhook(payload, signature, secret), "valid signature must verify");
assert.ok(!verifyWebhook(payload, signature, "wrong_secret"), "wrong secret must fail");
assert.ok(!verifyWebhook(payload + " ", signature, secret), "tampered body must fail");
assert.ok(!verifyWebhook(payload, "deadbeef", secret), "invalid signature must fail");

console.log("PASS: webhook HMAC-SHA256 (hex) contract");
