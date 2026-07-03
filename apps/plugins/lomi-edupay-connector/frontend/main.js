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
  paymentSection.classList.add("hidden");
  updatePayButtonState();
}

async function mountPaymentElement(clientSecret, publishableKey) {
  if (!publishableKey) {
    throw new Error("LOMI_PUBLISHABLE_KEY is missing on the server");
  }

  teardownPaymentElement();
  activeClientSecret = clientSecret;

  lomi = await loadLomi(publishableKey);
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

async function postFeeCharge(formData) {
  const response = await fetch("/api/v1/fees/charge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rail: formData.get("rail"),
      amount: Number(formData.get("amount")),
      payment_reference: formData.get("payment_reference"),
      school_id: formData.get("school_id"),
      student_id: formData.get("student_id"),
      fee_code: formData.get("fee_code"),
      term_id: formData.get("term_id") || undefined,
      customer_name: formData.get("customer_name"),
      customer_email: formData.get("customer_email") || undefined,
      customer_phone: formData.get("customer_phone"),
    }),
  });
  const data = await response.json();
  printJson(output, data);
  if (!response.ok) {
    throw new Error(data.error || "Charge failed");
  }
  return data;
}

document.getElementById("fee-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  setPaymentError("");
  teardownPaymentElement();

  try {
    const formData = new FormData(event.target);
    const data = await postFeeCharge(formData);

    if (formData.get("rail") === "card" && data.client_secret) {
      const configResponse = await fetch("/api/config");
      const config = await configResponse.json();
      await mountPaymentElement(data.client_secret, config.lomi_publishable_key);
    }
  } catch (error) {
    setPaymentError(error.message);
  }
});

payCardButton.addEventListener("click", async () => {
  if (!lomi || !activeClientSecret) {
    return;
  }
  setPaymentError("");
  payCardButton.disabled = true;

  try {
    const result = await lomi.confirmPayment({ clientSecret: activeClientSecret });
    printJson(output, result);
  } catch (error) {
    setPaymentError(error.message);
  } finally {
    updatePayButtonState();
  }
});

document.getElementById("refresh-events").addEventListener("click", async () => {
  const response = await fetch("/api/webhooks/events");
  const data = await response.json();
  printJson(eventsOutput, data.events || []);
});
