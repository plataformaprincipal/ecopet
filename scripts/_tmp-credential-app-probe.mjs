/**
 * Probe sanitizado: /users/me + GET order com token local.
 * Não imprime token. Não cria cobrança.
 */
import fs from "node:fs";
import path from "node:path";

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    let v = line.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    out[line.slice(0, eq).trim()] = v;
  }
  return out;
}

const e2e = loadEnvFile(path.join(process.cwd(), "apps/web/.env.e2e.local"));
const verify = loadEnvFile(path.join(process.cwd(), "apps/web/.env.preview.verify"));
const env = { ...verify, ...e2e };
const token = env.MERCADO_PAGO_ACCESS_TOKEN;
if (!token) {
  console.log(JSON.stringify({ ok: false, reason: "NO_TOKEN" }));
  process.exit(1);
}

const orderId = "ORDTST01KZJJ1W6BXHNN3X9EFMR1A1MH";

async function mp(pathname) {
  const res = await fetch(`https://api.mercadopago.com${pathname}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { rawLen: text.length };
  }
  return { status: res.status, data };
}

const me = await mp("/users/me");
const ord = await mp(`/v1/orders/${orderId}`);

const meSafe = {
  status: me.status,
  id: me.data?.id ?? null,
  nickname: me.data?.nickname ? String(me.data.nickname).slice(0, 24) : null,
  site_id: me.data?.site_id ?? null,
  email_domain: me.data?.email
    ? String(me.data.email).split("@")[1] || null
    : null,
};

const ordSafe = {
  status: ord.status,
  id: ord.data?.id
    ? `${String(ord.data.id).slice(0, 8)}…${String(ord.data.id).slice(-4)}`
    : null,
  status_order: ord.data?.status ?? null,
  type: ord.data?.type ?? null,
  // campos de identidade se existirem
  application_id:
    ord.data?.application_id ??
    ord.data?.applicationId ??
    ord.data?.client_id ??
    null,
  collector_id: ord.data?.collector_id ?? ord.data?.user_id ?? null,
  external_reference: ord.data?.external_reference ?? null,
  error:
    ord.status >= 400
      ? {
          code: ord.data?.error ?? ord.data?.code ?? null,
          message: String(ord.data?.message || "").slice(0, 160),
        }
      : null,
};

console.log(
  JSON.stringify(
    {
      tokenPrefix: String(token).slice(0, 12),
      tokenKind: String(token).startsWith("TEST-")
        ? "TEST"
        : String(token).startsWith("APP_USR-")
          ? "APP_USR"
          : "OTHER",
      usersMe: meSafe,
      orderLookup: ordSafe,
      compare: {
        simulator_application_id: "3863741237237502",
        simulator_user_id: "652366957",
        natural_webhook_application_id: "2558117866767882",
        natural_webhook_user_id: "3549381009",
        credential_user_id: meSafe.id != null ? String(meSafe.id) : null,
        order_visible_with_credential_token: ord.status === 200,
        credential_user_matches_simulator:
          meSafe.id != null && String(meSafe.id) === "652366957",
        credential_user_matches_natural_webhook:
          meSafe.id != null && String(meSafe.id) === "3549381009",
      },
    },
    null,
    2,
  ),
);
