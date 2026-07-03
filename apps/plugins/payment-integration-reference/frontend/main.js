const output = document.getElementById("output");
const eventsOutput = document.getElementById("events-output");
const checkoutEmbed = document.getElementById("checkout-embed");
let lastCheckoutUrl = null;
let lastEmbeddedCheckoutUrl = null;

function printJson(element, value) {
  element.textContent = JSON.stringify(value, null, 2);
}

function withEmbeddedParam(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("embedded", "true");
    return parsed.toString();
  } catch {
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}embedded=true`;
  }
}

function checkoutUrlFromSession(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (payload.checkout_url) return payload.checkout_url;
  const id = payload.checkout_session?.checkout_session_id;
  return id ? `https://checkout.lomi.africa/checkout/${id}` : null;
}

async function submitCheckout(path, payload) {
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

  const checkoutUrl = checkoutUrlFromSession(data);
  if (checkoutUrl) {
    lastCheckoutUrl = checkoutUrl;
    lastEmbeddedCheckoutUrl = data.embedded_checkout_url || withEmbeddedParam(checkoutUrl);
    const shouldOpen = window.confirm("Session created. Open checkout in a new tab now?");
    if (shouldOpen) {
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    }
  }
}

function embedLastCheckoutUrl() {
  if (!lastEmbeddedCheckoutUrl) {
    alert("No checkout URL available yet. Create a session first.");
    return;
  }

  checkoutEmbed.src = lastEmbeddedCheckoutUrl;
}

document.getElementById("dynamic-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);

  const payload = {
    amount: Number(form.get("amount")),
    currency_code: String(form.get("currency_code") || "XOF"),
    customer_email: String(form.get("customer_email") || ""),
    title: "Dynamic amount payment",
    description: "Created from payment integration reference UI",
  };

  try {
    await submitCheckout("/api/checkout/dynamic", payload);
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById("price-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);

  const payload = {
    price_id: String(form.get("price_id") || ""),
    quantity: Number(form.get("quantity") || 1),
    customer_email: String(form.get("customer_email") || ""),
    title: "Price-led checkout payment",
    description: "Created from payment integration reference UI",
  };

  try {
    await submitCheckout("/api/checkout/price", payload);
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById("line-items-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const rawLineItems = String(form.get("line_items") || "[]");

  let lineItems;
  try {
    lineItems = JSON.parse(rawLineItems);
  } catch {
    alert("line_items must be valid JSON");
    return;
  }

  const payload = {
    customer_email: String(form.get("customer_email") || ""),
    currency_code: "XOF",
    line_items: lineItems,
    title: "Line-items checkout payment",
    description: "Created from payment integration reference UI",
  };

  try {
    await submitCheckout("/api/checkout/line-items", payload);
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById("refresh-events").addEventListener("click", async () => {
  const response = await fetch("/api/webhooks/events");
  const data = await response.json();
  printJson(eventsOutput, data);
});

document.getElementById("embed-last-session").addEventListener("click", embedLastCheckoutUrl);

document.getElementById("open-last-session").addEventListener("click", () => {
  if (!lastCheckoutUrl) {
    alert("No checkout URL available yet. Create a session first.");
    return;
  }

  window.open(lastCheckoutUrl, "_blank", "noopener,noreferrer");
});

document.getElementById("clear-embed").addEventListener("click", () => {
  checkoutEmbed.removeAttribute("src");
});
