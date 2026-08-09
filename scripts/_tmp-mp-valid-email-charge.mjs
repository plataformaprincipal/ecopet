import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "crypto";

function load(file) {
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    let v = line.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = v;
  }
  return out;
}

const env = load(path.join(process.cwd(), "apps/web/.env.preview.verify"));
const token = env.MERCADO_PAGO_ACCESS_TOKEN;
const pub = env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
const email = `ecopet.sandbox.${Date.now()}@gmail.com`;

async function tokenCard() {
  const res = await fetch(
    `https://api.mercadopago.com/v1/card_tokens?public_key=${encodeURIComponent(pub)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_number: "5031433215406351",
        expiration_month: 11,
        expiration_year: 2030,
        security_code: "123",
        cardholder: {
          name: "APRO",
          identification: { type: "CPF", number: "12345678909" },
        },
      }),
    }
  );
  return res.json();
}

const tok = await tokenCard();
const orderRes = await fetch("https://api.mercadopago.com/v1/orders", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Idempotency-Key": randomUUID().slice(0, 64),
  },
  body: JSON.stringify({
    type: "online",
    processing_mode: "automatic",
    external_reference: `probeord${Date.now()}`,
    total_amount: "40.00",
    description: "EcoPet sandbox card",
    payer: {
      email,
      first_name: "APRO",
      last_name: "TEST",
      identification: { type: "CPF", number: "12345678909" },
    },
    transactions: {
      payments: [
        {
          amount: "40.00",
          payment_method: {
            id: "master",
            type: "credit_card",
            token: tok.id,
            installments: 1,
          },
        },
      ],
    },
  }),
});
const orderText = await orderRes.text();
console.log(
  JSON.stringify({
    kind: "orders_card",
    status: orderRes.status,
    raw: orderText.slice(0, 500).replace(/APP_USR-[A-Za-z0-9_-]+/g, "APP_USR-***"),
  })
);

const tok2 = await tokenCard();
const classic = await fetch("https://api.mercadopago.com/v1/payments", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Idempotency-Key": randomUUID(),
  },
  body: JSON.stringify({
    transaction_amount: 40,
    token: tok2.id,
    description: "EcoPet classic sandbox",
    installments: 1,
    payment_method_id: "master",
    payer: {
      email,
      identification: { type: "CPF", number: "12345678909" },
    },
  }),
});
const classicText = await classic.text();
console.log(
  JSON.stringify({
    kind: "classic_card",
    status: classic.status,
    raw: classicText.slice(0, 500).replace(/APP_USR-[A-Za-z0-9_-]+/g, "APP_USR-***"),
  })
);

const boleto = await fetch("https://api.mercadopago.com/v1/orders", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Idempotency-Key": randomUUID().slice(0, 64),
  },
  body: JSON.stringify({
    type: "online",
    processing_mode: "automatic",
    external_reference: `probebol${Date.now()}`,
    total_amount: "40.00",
    description: "EcoPet boleto sandbox",
    payer: {
      email,
      first_name: "APRO",
      last_name: "TEST",
      identification: { type: "CPF", number: "12345678909" },
    },
    transactions: {
      payments: [
        {
          amount: "40.00",
          payment_method: { id: "bolbradesco", type: "ticket" },
        },
      ],
    },
  }),
});
const boletoText = await boleto.text();
console.log(
  JSON.stringify({
    kind: "orders_boleto",
    status: boleto.status,
    raw: boletoText.slice(0, 500).replace(/APP_USR-[A-Za-z0-9_-]+/g, "APP_USR-***"),
  })
);
