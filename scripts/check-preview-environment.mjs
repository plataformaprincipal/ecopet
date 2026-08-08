/**
 * Verifica ambiente Preview de homologação sem exibir secrets.
 *
 * Uso:
 *   node scripts/check-preview-environment.mjs [path/.env.preview]
 *   node scripts/check-preview-environment.mjs --env-file path/.env.preview
 *   PREVIEW_ENV_FILE=... PRODUCTION_ENV_FILE=... node scripts/check-preview-environment.mjs
 *
 * Mercado Pago (test):
 *   - Prefixo TEST- confirma sandbox.
 *   - Prefixo APP_USR- também é emitido oficialmente para credenciais de teste;
 *     nesse caso exige MERCADO_PAGO_ENVIRONMENT=test|sandbox e/ou prova via API
 *     (sem imprimir o token).
 *
 * Exit 0 = OK para avançar (critérios mínimos).
 * Exit ≠ 0 = bloqueio.
 */
import fs from "fs";
import crypto from "crypto";
import path from "path";

const REQUIRED = [
  "DATABASE_URL",
  "DIRECT_URL",
  "MERCADO_PAGO_ACCESS_TOKEN",
  "NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY",
  "MERCADO_PAGO_WEBHOOK_SECRET",
  "PAYMENT_PROVIDER",
  "FINANCIAL_LEDGER_ENABLED",
  "PAYOUTS_ENABLED",
  "MANUAL_PAYOUT_APPROVAL_REQUIRED",
  "RESERVE_ENABLED",
  "CHARGEBACKS_ENABLED",
  "DAILY_RECONCILIATION_ENABLED",
  "APP_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXTAUTH_URL",
  "WEB_URL",
];

const FINANCIAL_EXPECTED = {
  FINANCIAL_LEDGER_ENABLED: true,
  PAYOUTS_ENABLED: true,
  MANUAL_PAYOUT_APPROVAL_REQUIRED: true,
  RESERVE_ENABLED: true,
  CHARGEBACKS_ENABLED: true,
  DAILY_RECONCILIATION_ENABLED: false,
};

function parseEnvFile(file) {
  if (!file || !fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, i)] = v;
  }
  return out;
}

function resolvePreviewEnvFile() {
  const args = process.argv.slice(2);
  const flagIdx = args.indexOf("--env-file");
  if (flagIdx >= 0) {
    const p = args[flagIdx + 1];
    if (!p || p.startsWith("--")) {
      console.error("Uso: --env-file <caminho>");
      process.exit(2);
    }
    return p;
  }
  const positional = args.find((a) => !a.startsWith("--"));
  return positional || process.env.PREVIEW_ENV_FILE || "";
}

function loadPreviewEnv() {
  const file = resolvePreviewEnvFile();
  if (file) {
    // Arquivo é a única fonte — evita falsos positivos/negativos do process.env local
    const fileVars = parseEnvFile(path.resolve(file));
    return {
      ...fileVars,
      __sourceFile: file,
      VERCEL_ENV: fileVars.VERCEL_ENV || "preview",
    };
  }
  return { ...process.env, __sourceFile: "(process.env)" };
}

function loadProductionEnv() {
  const file = process.env.PRODUCTION_ENV_FILE || "";
  return file ? parseEnvFile(path.resolve(file)) : {};
}

function present(v) {
  return typeof v === "string" && v.trim().length > 0 && v !== "[SENSITIVE]";
}

function envBool(v) {
  if (v === undefined || v === null || v === "") return null;
  const s = String(v).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(s)) return true;
  if (["0", "false", "no", "off"].includes(s)) return false;
  return null;
}

function fingerprint(value) {
  if (!present(value)) return "ausente";
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function safeHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return "(inválido)";
  }
}

function isLocalhostUrl(url) {
  if (!present(url)) return true;
  try {
    const u = new URL(url);
    return (
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname === "0.0.0.0" ||
      u.hostname.endsWith(".local")
    );
  } catch {
    return true;
  }
}

/**
 * Classifica formato oficial de credencial MP sem imprimir o valor.
 * TEST-* e APP_USR-* são ambos emitidos para credenciais de teste (e APP_USR também em produção).
 */
function classifyMpCredential(value) {
  if (!present(value)) return { ok: false, kind: "absent" };
  const v = value.trim();
  if (v.length < 20) return { ok: false, kind: "too_short" };
  if (v.startsWith("TEST-") || /(^|-)TEST-/.test(v)) {
    return { ok: true, kind: "test_prefix" };
  }
  if (v.startsWith("APP_USR-")) {
    return { ok: true, kind: "app_usr" };
  }
  return { ok: false, kind: "unknown_format" };
}

function declaredMpEnvironment(preview) {
  return String(preview.MERCADO_PAGO_ENVIRONMENT || "")
    .trim()
    .toLowerCase();
}

async function probeMercadoPagoTestToken(accessToken) {
  try {
    const res = await fetch("https://api.mercadopago.com/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, evidence: "api_unauthorized" };
    }
    if (!res.ok) {
      return { ok: false, evidence: `api_http_${res.status}` };
    }
    const body = await res.json();
    const tags = Array.isArray(body?.tags) ? body.tags.map(String) : [];
    if (tags.includes("test_user") || tags.includes("test_user_migration")) {
      return { ok: true, evidence: "api_test_user_tag" };
    }
    // Token válido na API, sem tag de test_user (comum em credenciais de aplicação).
    return { ok: true, evidence: "api_token_valid" };
  } catch {
    return { ok: false, evidence: "api_unreachable" };
  }
}

/**
 * Confirma ambiente de teste sem revelar secrets.
 * Não assume que toda credencial oficial de teste tenha prefixo TEST-.
 */
async function confirmMercadoPagoTest(preview, production) {
  const token = preview.MERCADO_PAGO_ACCESS_TOKEN || "";
  const pub = preview.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "";
  const tokenCls = classifyMpCredential(token);
  const pubCls = classifyMpCredential(pub);
  const envDecl = declaredMpEnvironment(preview);
  const reasons = [];

  if (!tokenCls.ok) {
    return {
      confirmed: false,
      missing: `access token formato inválido/ausente (${tokenCls.kind})`,
    };
  }
  if (!pubCls.ok) {
    return {
      confirmed: false,
      missing: `public key formato inválido/ausente (${pubCls.kind})`,
    };
  }

  if (envDecl === "production" || envDecl === "prod" || envDecl === "live") {
    return {
      confirmed: false,
      missing: "MERCADO_PAGO_ENVIRONMENT declara production/live",
    };
  }

  if (
    present(production.MERCADO_PAGO_ACCESS_TOKEN) &&
    fingerprint(token) === fingerprint(production.MERCADO_PAGO_ACCESS_TOKEN)
  ) {
    return {
      confirmed: false,
      missing: "access token Preview fingerprint = Production",
    };
  }

  // Prova forte: prefixo TEST no access token
  if (tokenCls.kind === "test_prefix") {
    reasons.push("access_token_prefix_TEST");
    if (pubCls.kind === "test_prefix" || pubCls.kind === "app_usr") {
      reasons.push(`public_key_format_${pubCls.kind}`);
      return { confirmed: true, via: reasons.join("+") };
    }
  }

  // Credenciais APP_USR (ou mistas) — formato oficial também para teste
  const envIsTest = envDecl === "test" || envDecl === "sandbox";
  if (!envIsTest && tokenCls.kind === "app_usr") {
    // Tenta prova via API; sozinha não basta sem declaração de ambiente
    const probe = await probeMercadoPagoTestToken(token);
    if (probe.evidence === "api_test_user_tag") {
      return { confirmed: true, via: "api_test_user_tag" };
    }
    return {
      confirmed: false,
      missing:
        "credenciais no formato APP_USR (válido para teste oficial) sem MERCADO_PAGO_ENVIRONMENT=test|sandbox; adicione MERCADO_PAGO_ENVIRONMENT=test no arquivo Preview ou use access token com prefixo TEST-",
      api: probe.evidence,
    };
  }

  if (envIsTest && (tokenCls.kind === "app_usr" || tokenCls.kind === "test_prefix")) {
    reasons.push(`MERCADO_PAGO_ENVIRONMENT=${envDecl}`);
    reasons.push(`access_token_format_${tokenCls.kind}`);
    reasons.push(`public_key_format_${pubCls.kind}`);
    const probe = await probeMercadoPagoTestToken(token);
    if (probe.ok) {
      reasons.push(probe.evidence);
      return { confirmed: true, via: reasons.join("+") };
    }
    // Declaração test + formato oficial: aceitar mesmo se API indisponível,
    // mas reportar que a prova API não fechou.
    if (probe.evidence === "api_unreachable") {
      reasons.push("api_skipped_unreachable");
      return { confirmed: true, via: reasons.join("+") };
    }
    if (probe.evidence === "api_unauthorized") {
      return {
        confirmed: false,
        missing: "token rejeitado pela API Mercado Pago (401/403)",
      };
    }
    return { confirmed: true, via: reasons.join("+") };
  }

  return {
    confirmed: false,
    missing:
      "não foi possível comprovar ambiente de teste (formato/environment insuficientes)",
  };
}

function line(okFlag, msg) {
  console.log(`${okFlag ? "✓" : "✗"} ${msg}`);
}

const preview = loadPreviewEnv();
const production = loadProductionEnv();
let blocked = false;
const blockers = [];

function fail(msg) {
  blocked = true;
  blockers.push(msg);
  line(false, msg);
}

function ok(msg) {
  line(true, msg);
}

async function main() {
  console.log("=== check-preview-environment ===");
  console.log(`Fonte Preview: ${preview.__sourceFile}`);
  if (process.env.PRODUCTION_ENV_FILE) {
    console.log(
      `Fonte Production (comparação): ${process.env.PRODUCTION_ENV_FILE}`
    );
  }
  console.log("");

  // Presença
  for (const key of REQUIRED) {
    if (present(preview[key])) {
      ok(`${key}: presente`);
    } else {
      fail(`${key}: ausente ou redigido`);
    }
  }

  // Database fingerprints
  const dbFp = fingerprint(preview.DATABASE_URL);
  const directFp = fingerprint(preview.DIRECT_URL);
  ok(`Database fingerprint: ${dbFp}...`);
  ok(`Direct URL fingerprint: ${directFp}...`);
  if (present(preview.DATABASE_URL)) {
    ok(`Database host (sanitizado): ${safeHost(preview.DATABASE_URL)}`);
  }

  let dbIsolationOk = false;
  if (present(production.DATABASE_URL) && present(preview.DATABASE_URL)) {
    const prodFp = fingerprint(production.DATABASE_URL);
    if (dbFp === prodFp) {
      fail(
        "DATABASE_URL Preview parece igual a Production (fingerprint idêntico) — isolamento bloqueado"
      );
    } else {
      ok(`Database Preview ≠ Production (fp prod ${prodFp}...)`);
      dbIsolationOk = true;
    }
  } else if (!present(production.DATABASE_URL)) {
    fail(
      "PRODUCTION_ENV_FILE ausente/sem DATABASE_URL — isolamento Preview ≠ Production não comprovado"
    );
  }

  if (present(production.DIRECT_URL) && present(preview.DIRECT_URL)) {
    if (fingerprint(preview.DIRECT_URL) === fingerprint(production.DIRECT_URL)) {
      fail(
        "DIRECT_URL Preview parece igual a Production (fingerprint idêntico) — isolamento bloqueado"
      );
      dbIsolationOk = false;
    } else {
      ok("DIRECT_URL Preview ≠ Production");
    }
  }

  // Mercado Pago (formato oficial TEST- ou APP_USR-; ambiente comprovado com segurança)
  const mpResult = await confirmMercadoPagoTest(preview, production);
  if (mpResult.confirmed) {
    ok(`Mercado Pago test credentials: CONFIRMADO (${mpResult.via})`);
  } else {
    fail(
      `Mercado Pago test credentials: NÃO COMPROVADO — ${mpResult.missing}${
        mpResult.api ? ` [api=${mpResult.api}]` : ""
      }`
    );
  }

  const allowSim = envBool(preview.ALLOW_SIMULATED_PAYMENTS);
  if (allowSim === true) {
    fail("ALLOW_SIMULATED_PAYMENTS: true (deve ser false ou ausente)");
  } else {
    ok(
      `ALLOW_SIMULATED_PAYMENTS: ${
        allowSim === false ? "false" : "ausente (ok)"
      }`
    );
  }

  const payProvider = (preview.PAYMENT_PROVIDER || "").toLowerCase();
  if (payProvider === "mercado_pago" || payProvider === "mercadopago") {
    ok(`PAYMENT_PROVIDER: ${payProvider}`);
  } else if (present(preview.PAYMENT_PROVIDER)) {
    fail(`PAYMENT_PROVIDER: valor inesperado (${payProvider || "vazio"})`);
  } else {
    fail("PAYMENT_PROVIDER: ausente");
  }

  // Flags
  let flagsOk = true;
  for (const [key, expected] of Object.entries(FINANCIAL_EXPECTED)) {
    const actual = envBool(preview[key]);
    if (actual === expected) {
      ok(`${key}: ${expected ? "habilitado" : "desabilitado"}`);
    } else if (actual === null) {
      flagsOk = false;
      fail(`${key}: ausente (esperado ${expected})`);
    } else {
      flagsOk = false;
      fail(`${key}: ${actual} (esperado ${expected})`);
    }
  }
  if (envBool(preview.FINANCIAL_LEDGER_ENABLED) === true) {
    ok("Financial ledger: habilitado");
  }

  // URLs públicas — homolog estável
  const urlKeys = ["APP_URL", "NEXT_PUBLIC_APP_URL", "NEXTAUTH_URL", "WEB_URL"];
  let homologOk = true;
  for (const key of urlKeys) {
    const v = preview[key];
    if (!present(v)) {
      homologOk = false;
      fail(`${key}: ausente`);
      continue;
    }
    if (isLocalhostUrl(v)) {
      homologOk = false;
      fail(`${key}: aponta para localhost/inválido (${safeHost(v)})`);
      continue;
    }
    const host = safeHost(v);
    if (host !== "homolog.eccopet.com") {
      homologOk = false;
      fail(`${key}: host ${host} (esperado homolog.eccopet.com)`);
    } else {
      ok(`${key}: host homolog.eccopet.com`);
    }
  }

  // Ambiente Preview (quando disponível)
  const vercelEnv = preview.VERCEL_ENV || process.env.VERCEL_ENV || "";
  if (vercelEnv) {
    if (vercelEnv === "preview" || vercelEnv === "development") {
      ok(`Ambiente: ${vercelEnv}`);
    } else if (vercelEnv === "production") {
      fail("Ambiente: production (este check é para Preview/homologação)");
    } else {
      ok(`Ambiente: ${vercelEnv}`);
    }
  } else {
    ok("Ambiente: VERCEL_ENV não informado (validação por arquivo Preview)");
  }

  console.log("");
  console.log("--- resumo sanitizado ---");
  console.log(
    `Preview DB != Production DB: ${dbIsolationOk ? "OK" : "FALHA"}`
  );
  console.log(
    `Mercado Pago test credentials: ${
      mpResult.confirmed ? "CONFIRMADO" : "NÃO COMPROVADO"
    }`
  );
  console.log(`flags financeiras: ${flagsOk ? "OK" : "FALHA"}`);
  console.log(
    `URL homolog.eccopet.com: ${homologOk ? "OK" : "FALHA"}`
  );

  if (blocked) {
    console.log("");
    console.log("RESULTADO: BLOQUEADO");
    console.log(`Motivos: ${blockers.length}`);
    // setTimeout: evita assertion UV_HANDLE_CLOSING no Windows após fetch/undici
    setTimeout(() => process.exit(2), 50);
    return;
  }
  console.log("");
  console.log("RESULTADO: OK — critérios mínimos de Preview satisfeitos");
  setTimeout(() => process.exit(0), 50);
}

main().catch((err) => {
  console.error("Falha interna do check (sem secrets):", err?.message || "error");
  setTimeout(() => process.exit(2), 50);
});
