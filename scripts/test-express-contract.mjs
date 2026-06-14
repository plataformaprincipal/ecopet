/**
 * Testes de contrato — API Express padronizada
 */
const API = process.env.API_URL || "http://localhost:4000";

function assert(c, m) { if (!c) throw new Error(m); }

async function get(path) {
  const res = await fetch(`${API}${path}`);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function assertEnvelope(data, label) {
  assert(typeof data.success === "boolean", `${label}: success boolean`);
  if (data.success) {
    assert("data" in data, `${label}: data presente quando success=true`);
  } else {
    assert(data.error?.code, `${label}: error.code presente`);
    assert(data.error?.message, `${label}: error.message presente`);
  }
}

async function main() {
  const health = await get("/health");
  assert(health.status === 200 || health.status === 503, "health responde");
  assertEnvelope(health.data, "GET /health");

  const apiHealth = await get("/api/health");
  assertEnvelope(apiHealth.data, "GET /api/health");

  const bootstrap = await get("/api/auth/bootstrap/status");
  assert(bootstrap.status === 200, "bootstrap status 200");
  assertEnvelope(bootstrap.data, "GET /api/auth/bootstrap/status");

  console.log("✓ test:express-contract passou");
}

main().catch((e) => { console.error("✗", e.message); process.exit(1); });
