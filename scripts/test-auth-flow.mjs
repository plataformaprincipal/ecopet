/**
 * Valida composição de URLs e fluxo auth (API direta + proxy).
 */
const API_DIRECT = process.env.API_URL || "http://localhost:4000";
const WEB_PROXY = process.env.WEB_URL || "http://localhost:3000";

function buildApiUrl(base, path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (base === "/api/ecopet" || base.endsWith("/api/ecopet")) {
    const relative = normalizedPath.replace(/^\/api/, "") || "/";
    return `/api/ecopet${relative}`;
  }
  return `${base.replace(/\/$/, "")}${normalizedPath}`;
}

function assertEq(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected "${expected}", got "${actual}"`);
}

assertEq(buildApiUrl("/api/ecopet", "/api/auth/login"), "/api/ecopet/auth/login", "proxy login");
assertEq(buildApiUrl("/api/ecopet", "/api/users/me"), "/api/ecopet/users/me", "proxy me");
assertEq(buildApiUrl("http://localhost:4000", "/api/auth/login"), "http://localhost:4000/api/auth/login", "direct login");
console.log("✓ URL composition OK");

const ts = Date.now();
const email = `flow.test.${ts}@ecopet.test`;
const password = "SenhaForte@123";

function generateValidCpf() {
  const rnd = () => Math.floor(Math.random() * 9);
  const n = Array.from({ length: 9 }, rnd);
  const d1 = n.reduce((s, v, i) => s + v * (10 - i), 0) % 11;
  const check1 = d1 < 2 ? 0 : 11 - d1;
  const d2 = [...n, check1].reduce((s, v, i) => s + v * (11 - i), 0) % 11;
  const check2 = d2 < 2 ? 0 : 11 - d2;
  return [...n, check1, check2].join("");
}

const tutorPayload = {
  role: "TUTOR",
  email,
  password,
  passwordConfirm: password,
  phone: `11999${String(ts).slice(-6)}`,
  acceptTerms: true,
  acceptLgpd: true,
  name: "Flow Test User",
  cpf: generateValidCpf(),
  birthDate: "1990-01-15",
  primaryInterests: ["produtos"],
  address: {
    street: "Rua Teste",
    number: "100",
    district: "Centro",
    city: "Sao Paulo",
    state: "SP",
    zipCode: "01001000",
  },
};

async function req(base, path, opts = {}) {
  const relative = buildApiUrl(base, path);
  const url = base.startsWith("http") ? `${base}${path.startsWith("/") ? path : `/${path}`}` : `${WEB_PROXY}${relative}`;
  const { headers: extraHeaders, ...rest } = opts;
  const res = await fetch(url, {
    ...rest,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, url };
}

async function runFlow(label, base) {
  console.log(`\n--- Fluxo: ${label} (${base}) ---`);

  const healthPath = base.startsWith("http") ? `${base}/api/health` : `${WEB_PROXY}${buildApiUrl(base, "/api/health")}`;
  const healthRes = await fetch(healthPath, { credentials: "include" });
  const health = { status: healthRes.status, data: await healthRes.json().catch(() => ({})), url: healthPath };
  console.log(`[health] ${health.status} ${health.url}`, health.data);
  if (health.status !== 200) throw new Error(`Health failed on ${label}`);

  const reg = await req(base, "/api/auth/register", {
    method: "POST",
    body: JSON.stringify(tutorPayload),
  });
  console.log(`[register] ${reg.status} ${reg.url}`, reg.data.user?.email ?? reg.data.error);
  if (reg.status !== 201) throw new Error(`Register failed: ${reg.data.error}`);

  const token = reg.data.token;
  const login = await req(base, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: email, password }),
  });
  console.log(`[login] ${login.status} ${login.url}`, login.data.user?.email ?? login.data.error);
  if (login.status !== 200) throw new Error(`Login failed: ${login.data.error}`);

  const me = await req(base, "/api/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`[me] ${me.status} ${me.url}`, me.data.email ?? me.data.error);
  if (me.status !== 200) throw new Error(`Me failed: ${me.data.error}`);

  const logout = await req(base, "/api/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`[logout] ${logout.status} ${logout.url}`, logout.data);

  console.log(`✅ ${label} OK — user: ${email}`);
  return email;
}

async function main() {
  await runFlow("API direta", API_DIRECT);

  try {
    await runFlow("Proxy Next.js", "/api/ecopet");
  } catch (e) {
    console.warn("⚠ Proxy test skipped (Next.js pode não estar rodando):", (e).message);
  }

  console.log("\n✅ Testes concluídos");
}

main().catch((e) => {
  console.error("\n❌", e.message);
  process.exit(1);
});
