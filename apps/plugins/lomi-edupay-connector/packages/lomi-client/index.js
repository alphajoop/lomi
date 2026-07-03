const DEFAULT_BASE_URL = "https://sandbox.api.lomi.africa";

function buildIdempotencyKey(paymentReference) {
  const ref = String(paymentReference).trim();
  return `edupay_${ref}`;
}

function buildDescription(input) {
  if (input.description) {
    return input.description;
  }
  const { school_id, student_id, fee_code, term_id } = input.metadata;
  const term = term_id ? ` term=${term_id}` : "";
  return `EduPay fee ${input.payment_reference} school=${school_id} student=${student_id} fee=${fee_code}${term}`;
}

function mergeCardMetadata(input) {
  return {
    integration_source: "edupay",
    payment_reference: input.payment_reference,
    ...input.metadata,
  };
}

function createLomiClient(options) {
  const baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
  const apiKey = options.apiKey;

  if (!apiKey) {
    throw new Error("LOMI_SECRET_KEY is required to create lomi client");
  }

  async function request(method, routePath, body, requestOptions = {}) {
    const headers = {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    };

    if (requestOptions.idempotencyKey) {
      headers["Idempotency-Key"] = requestOptions.idempotencyKey;
    }

    if (requestOptions.scenarioKey) {
      headers["X-Scenario-Key"] = requestOptions.scenarioKey;
    }

    const response = await fetch(`${baseUrl}${routePath}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || data?.error || "lomi API request failed";
      throw new Error(typeof message === "string" ? message : JSON.stringify(message));
    }

    return { status: response.status, data };
  }

  async function createWaveCharge(input, extra = {}) {
    const payload = {
      amount: input.amount,
      currency: input.currency || "XOF",
      customer: {
        name: input.customer.name,
        email: input.customer.email || undefined,
        phoneNumber: input.customer.phone,
      },
      description: buildDescription(input),
      successUrl: input.success_url,
      errorUrl: input.error_url,
    };

    return request("POST", "/charge/wave", payload, {
      idempotencyKey: buildIdempotencyKey(input.payment_reference),
      scenarioKey: extra.scenarioKey,
    });
  }

  async function createMtnCharge(input, extra = {}) {
    const payload = {
      amount: input.amount,
      currency: input.currency || "XOF",
      customer: {
        name: input.customer.name,
        email: input.customer.email || undefined,
        phoneNumber: input.customer.phone,
      },
      description: buildDescription(input),
      countryCode: input.country_code || "CI",
      quantity: 1,
    };

    return request("POST", "/charge/mtn", payload, {
      idempotencyKey: buildIdempotencyKey(input.payment_reference),
      scenarioKey: extra.scenarioKey,
    });
  }

  async function createCardCharge(input) {
    const email = String(input.customer.email || "").trim();
    const name = String(input.customer.name || "").trim();

    if (!email || !name) {
      throw new Error("customer.email and customer.name are required for card charges");
    }

    const payload = {
      amount: input.amount,
      currency_code: input.currency || "XOF",
      customer_email: email,
      customer_name: name,
      customer_phone: input.customer.phone || undefined,
      payment_reference: input.payment_reference,
      description: buildDescription(input),
      metadata: mergeCardMetadata(input),
    };

    return request("POST", "/charge/card", payload, {
      idempotencyKey: buildIdempotencyKey(input.payment_reference),
    });
  }

  async function getCardCharge(chargeId) {
    return request("GET", `/charge/card/${encodeURIComponent(chargeId)}`);
  }

  async function getTransaction(transactionId) {
    return request("GET", `/transactions/${encodeURIComponent(transactionId)}`);
  }

  return {
    createWaveCharge,
    createMtnCharge,
    createCardCharge,
    getCardCharge,
    getTransaction,
  };
}

function createEduPayLomiClient(options) {
  return createLomiClient(options);
}

module.exports = {
  createLomiClient,
  createEduPayLomiClient,
  buildIdempotencyKey,
};
