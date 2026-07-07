import {
  loadLomi,
  createLomiElements,
  createLomiPaymentElement,
} from "/vendor/lomi-elements.js";

const output = document.getElementById("output");
const eventsOutput = document.getElementById("events-output");
const paymentSection = document.getElementById("payment-section");
const paymentErrors = document.getElementById("payment-errors");
const payCardButton = document.getElementById("pay-card-button");

let lomi = null;
let elements = null;
let paymentElement = null;
let activeClientSecret = null;

function printJson(element, value) {
  element.textContent = JSON.stringify(value, null, 2);
}

function setPaymentError(message) {
  paymentErrors.textContent = message || "";
}

function updatePayButtonState() {
  payCardButton.disabled = !(lomi && elements && activeClientSecret);
}

function teardownPaymentElement() {
  if (paymentElement) {
    paymentElement.unmount();
  }
  paymentElement = null;
  elements = null;
  activeClientSecret = null;
  updatePayButtonState();
}

async function mountPaymentElement(clientSecret, publishableKey) {
  if (!publishableKey) {
    throw new Error("LOMI_PUBLISHABLE_KEY is missing on the server (.env)");
  }

  teardownPaymentElement();
  activeClientSecret = clientSecret;

  lomi = await loadLomi(publishableKey);
  if (!lomi) {
    throw new Error("Failed to initialize @lomi./sdk");
  }

  elements = createLomiElements(lomi, {
    clientSecret,
    theme: "night",
    borderRadiusPx: 8,
  });
  paymentElement = createLomiPaymentElement(elements, { billingAddress: "never" });
  paymentElement.mount("#payment-element");

  paymentSection.classList.remove("hidden");
  updatePayButtonState();
}

async function postJson(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  printJson(output, data);
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

document.getElementById("wave-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    await postJson("/api/charge/wave", {
      amount: Number(form.get("amount")),
      currency: "XOF",
      customer_name: String(form.get("customer_name") || ""),
      customer_email: String(form.get("customer_email") || ""),
      customer_phone: String(form.get("customer_phone") || ""),
    });
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById("mtn-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    await postJson("/api/charge/mtn", {
      amount: Number(form.get("amount")),
      currency: "XOF",
      customer_name: String(form.get("customer_name") || ""),
      customer_email: String(form.get("customer_email") || ""),
      customer_phone: String(form.get("customer_phone") || ""),
      country_code: String(form.get("country_code") || "CI"),
    });
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById("card-setup-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);

  try {
    const configResponse = await fetch("/api/config");
    const config = await configResponse.json();

    const charge = await postJson("/api/charge/card", {
      amount: Number(form.get("amount")),
      currency_code: String(form.get("currency_code") || "XOF"),
      customer_name: String(form.get("customer_name") || ""),
      customer_email: String(form.get("customer_email") || ""),
    });

    const clientSecret = charge?.data?.client_secret;
    if (!clientSecret) {
      throw new Error("Missing client_secret in card charge response");
    }

    await mountPaymentElement(clientSecret, config.lomi_publishable_key);
  } catch (error) {
    alert(error.message);
  }
});

payCardButton.addEventListener("click", async () => {
  if (!lomi || !elements || !activeClientSecret) {
    alert("Create a card charge first.");
    return;
  }

  payCardButton.disabled = true;
  setPaymentError("");

  try {
    const { error, paymentIntent } = await lomi.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?status=success`,
      },
    });

    if (error) {
      setPaymentError(error.message || "Payment failed");
      printJson(output, { error });
      return;
    }

    printJson(output, { paymentIntent });
    if (paymentIntent?.status === "succeeded") {
      alert("Payment succeeded. Check webhooks for final reconciliation.");
    } else if (paymentIntent?.status === "requires_action") {
      alert("Additional authentication required — follow the on-screen prompts.");
    } else {
      alert(`Payment status: ${paymentIntent?.status || "unknown"}`);
    }
  } catch (error) {
    setPaymentError(error.message || "Unexpected error");
  } finally {
    updatePayButtonState();
  }
});

document.getElementById("refresh-events").addEventListener("click", async () => {
  const response = await fetch("/api/webhooks/events");
  const data = await response.json();
  printJson(eventsOutput, data);
});
