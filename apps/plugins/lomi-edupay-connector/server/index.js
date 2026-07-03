const crypto = require("crypto");
const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createEduPayLomiClient } = require("@edupay/lomi-client");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3010);
const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:${port}`;
const lomiBaseUrl = process.env.LOMI_BASE_URL || "https://sandbox.api.lomi.africa";
const lomiApiKey = process.env.LOMI_SECRET_KEY;
const lomiPublishableKey =
  process.env.LOMI_PUBLISHABLE_KEY || process.env.LOMI_PUBLIC_KEY || "";
const webhookSecret =
  process.env.LOMI_WEBHOOK_SECRET || process.env.LOMI_WEBHOOK_VERIFICATION_TOKEN || "";
const edupayForwardUrl = process.env.EDUPAY_WEBHOOK_FORWARD_URL || "";

const lomi = lomiApiKey
  ? createEduPayLomiClient({
      apiKey: lomiApiKey,
      baseUrl: lomiBaseUrl,
    })
  : null;

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(cors({ origin: appBaseUrl }));
app.use(express.static(path.join(__dirname, "..", "frontend")));

const webhookEvents = [];
const MAX_EVENTS = 100;

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function requireLomi(_req, res, next) {
  if (!lomi) {
    return res.status(500).json({ error: "LOMI_SECRET_KEY is not configured" });
  }
  return next();
}

function parseFeeChargeBody(body) {
  const amount = toNumber(body.amount);
  if (!amount || amount <= 0) {
    throw new Error("amount must be a positive number");
  }

  const payment_reference = String(body.payment_reference || "").trim();
  if (!payment_reference) {
    throw new Error("payment_reference is required");
  }

  const school_id = String(body.school_id || body.metadata?.school_id || "").trim();
  const student_id = String(body.student_id || body.metadata?.student_id || "").trim();
  const fee_code = String(body.fee_code || body.metadata?.fee_code || "").trim();
  const term_id = String(body.term_id || body.metadata?.term_id || "").trim() || undefined;

  if (!school_id || !student_id || !fee_code) {
    throw new Error("school_id, student_id, and fee_code are required");
  }

  const name = String(body.customer_name || body.customer?.name || "").trim();
  const phone = String(body.customer_phone || body.customer?.phone || "").trim();
  const email = String(body.customer_email || body.customer?.email || "").trim() || undefined;

  if (!name || !phone) {
    throw new Error("customer name and phone (E.164) are required");
  }

  return {
    amount,
    currency: String(body.currency || body.currency_code || "XOF"),
    payment_reference,
    metadata: {
      school_id,
      student_id,
      fee_code,
      term_id,
      integration_source: "edupay",
    },
    customer: { name, email, phone },
    description: body.description,
    success_url: body.success_url || `${appBaseUrl}/?status=success`,
    error_url: body.error_url || `${appBaseUrl}/?status=error`,
    country_code: body.country_code || "CI",
  };
}

function extractEduPayContext(payload) {
  const data = payload?.data ?? payload;
  const metadata = data?.metadata ?? {};
  return {
    payment_reference:
      metadata.payment_reference ?? data?.payment_reference ?? metadata.paymentReference ?? null,
    school_id: metadata.school_id ?? null,
    student_id: metadata.student_id ?? null,
    fee_code: metadata.fee_code ?? null,
    transaction_id: data?.transaction_id ?? data?.id ?? null,
    status: data?.status ?? null,
  };
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "lomi-edupay-connector",
    lomi_base_url: lomiBaseUrl,
    configured: {
      lomi_api_key: Boolean(lomiApiKey),
      lomi_publishable_key: Boolean(lomiPublishableKey),
      webhook_secret: Boolean(webhookSecret),
      edupay_forward_url: Boolean(edupayForwardUrl),
    },
  });
});

app.get("/api/config", (_req, res) => {
  res.json({
    lomi_publishable_key: lomiPublishableKey || null,
    lomi_base_url: lomiBaseUrl,
    app_base_url: appBaseUrl,
  });
});

app.post("/api/v1/fees/charge", requireLomi, async (req, res) => {
  try {
    const input = parseFeeChargeBody(req.body);
    const rail = String(req.body.rail || "mtn").toLowerCase();
    const scenarioKey = req.get("X-Scenario-Key") || undefined;

    let result;
    if (rail === "wave") {
      result = await lomi.createWaveCharge(input, { scenarioKey });
    } else if (rail === "mtn") {
      result = await lomi.createMtnCharge(input, { scenarioKey });
    } else if (rail === "card") {
      result = await lomi.createCardCharge(input);
    } else {
      return res.status(400).json({ error: "rail must be wave, mtn, or card" });
    }

    return res.status(result.status).json({
      ...result.data,
      edupay: {
        payment_reference: input.payment_reference,
        school_id: input.metadata.school_id,
      },
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get("/api/charge/card/:id", requireLomi, async (req, res) => {
  try {
    const result = await lomi.getCardCharge(req.params.id);
    return res.status(result.status).json(result.data);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post("/api/webhooks/lomi", async (req, res) => {
  const signature = req.get("X-Lomi-Signature");
  const eventName = req.get("X-Lomi-Event");

  if (!signature) {
    return res.status(401).json({ ok: false, error: "Missing X-Lomi-Signature header" });
  }

  if (!webhookSecret) {
    return res.status(500).json({
      ok: false,
      error: "Set LOMI_WEBHOOK_SECRET in .env",
    });
  }

  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const isValid =
    signatureBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

  if (!isValid) {
    return res.status(401).json({ ok: false, error: "Invalid signature" });
  }

  const payload = req.body;
  const edupayContext = extractEduPayContext(payload);

  const record = {
    received_at: new Date().toISOString(),
    event: payload.event || eventName || null,
    edupay: edupayContext,
    payload,
  };

  webhookEvents.unshift(record);
  if (webhookEvents.length > MAX_EVENTS) {
    webhookEvents.length = MAX_EVENTS;
  }

  console.log("[edupay webhook]", record.event, edupayContext);

  if (edupayForwardUrl) {
    try {
      await fetch(edupayForwardUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
    } catch (forwardError) {
      console.error("[edupay forward failed]", forwardError.message);
    }
  }

  return res.status(200).json({ ok: true });
});

app.get("/api/webhooks/events", (req, res) => {
  const token = process.env.ADMIN_TOKEN;
  if (token && req.get("Authorization") !== `Bearer ${token}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ count: webhookEvents.length, events: webhookEvents });
});

app.listen(port, () => {
  console.log(`EduPay × lomi. connector running on ${appBaseUrl}`);
  console.log(`lomi base URL: ${lomiBaseUrl}`);
});
