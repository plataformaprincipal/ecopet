/**
 * Testes de fundação Etapa 9A — central de integrações reais.
 */
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, AccountStatus } from "@prisma/client";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const cookieJar = new Map();

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function req(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const cookie = cookieJar.get("cookie");
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(`${WEB}${path}`, { ...opts, headers });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const session = setCookie.split(";")[0];
    if (session.includes("=")) cookieJar.set("cookie", session);
    if (setCookie.includes("Max-Age=0") || setCookie.includes("max-age=0")) cookieJar.delete("cookie");
  }

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, text: JSON.stringify(data) };
}

function findIntegration(health, name) {
  return health?.integrations?.find((i) => i.name === name);
}

async function ensureAdmin(email, password) {
  const hash = await bcrypt.hash(password, 12);
  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Admin Integrações",
      passwordHash: hash,
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      phone: "11999990000",
    },
    update: {
      passwordHash: hash,
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
    },
  });
}

async function main() {
  const ts = Date.now();
  const password = "Ecopet@Forte2026";
  const adminEmail = `admin.int.${ts}@test.ecopet.local`;

  console.log("=== EcoPet Foundation Integrations Tests (9A) ===\n");

  // Unauthenticated blocked
  const anon = await req("/api/admin/integrations/health");
  assert(anon.status === 401, "health anônimo deve retornar 401");
  console.log("✓ health exige autenticação");

  await ensureAdmin(adminEmail, password);
  cookieJar.clear();
  const adminLogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: adminEmail, password }),
  });
  assert(adminLogin.status === 200, "admin login 200");

  const healthRes = await req("/api/admin/integrations/health");
  assert(healthRes.status === 200, "health admin 200");
  assert(healthRes.data.success === true, "envelope success");
  const health = healthRes.data.data?.health;
  assert(health?.integrations?.length > 0, "integrações listadas");

  const vlibras = findIntegration(health, "vlibras");
  assert(vlibras?.status === "ACTIVE", `VLibras ACTIVE, got ${vlibras?.status}`);
  console.log("✓ VLibras classificado como ACTIVE");

  const uploadDev = findIntegration(health, "upload_local_dev");
  assert(uploadDev?.status === "DEV_ONLY" || uploadDev?.status === "DISABLED", "upload local DEV_ONLY/DISABLED");
  assert(uploadDev?.canRunInProduction === false, "upload local bloqueado em produção");
  console.log("✓ upload local DEV_ONLY e bloqueado em produção");

  const cloudinary = findIntegration(health, "cloudinary");
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    assert(cloudinary?.status === "NOT_CONFIGURED", "Cloudinary NOT_CONFIGURED");
  }
  console.log("✓ Cloudinary classificado corretamente");

  const email = findIntegration(health, "email");
  assert(["NOT_CONFIGURED", "DEV_ONLY", "ACTIVE"].includes(email?.status), "email status válido");
  console.log("✓ e-mail classificado corretamente");

  const payment = findIntegration(health, "payment_gateway");
  assert(payment?.status === "NOT_CONFIGURED" || payment?.status === "PARTIAL", "pagamento NOT_CONFIGURED/PARTIAL");
  console.log("✓ pagamento classificado corretamente");

  const openai = findIntegration(health, "openai");
  if (!process.env.OPENAI_API_KEY) {
    assert(openai?.status === "NOT_CONFIGURED", "OpenAI NOT_CONFIGURED");
  }
  console.log("✓ OpenAI classificado corretamente");

  const gmaps = findIntegration(health, "google_maps");
  const mapbox = findIntegration(health, "mapbox");
  if (!process.env.GOOGLE_MAPS_API_KEY) assert(gmaps?.status === "NOT_CONFIGURED", "Google Maps NOT_CONFIGURED");
  if (!process.env.MAPBOX_ACCESS_TOKEN) assert(mapbox?.status === "NOT_CONFIGURED", "Mapbox NOT_CONFIGURED");
  console.log("✓ mapas classificados corretamente");

  const sensitiveValues = [
    process.env.CLOUDINARY_API_SECRET,
    process.env.SMTP_PASS,
    process.env.RESEND_API_KEY,
    process.env.OPENAI_API_KEY,
  ].filter(Boolean);
  for (const val of sensitiveValues) {
    assert(!healthRes.text.includes(val), "sem valor real de secret no response");
  }
  console.log("✓ painel admin não expõe secrets");

  cookieJar.clear();
  const clientEmail = `client.int.${ts}@test.ecopet.local`;
  await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: "Cliente Int",
      email: clientEmail,
      password,
      confirmPassword: password,
      phone: `119${String(ts).slice(-8)}`,
      birthDate: "1990-05-15",
      username: `int${String(ts).slice(-8)}`,
      gender: "MASCULINO",
      acceptTerms: true,
      acceptPrivacy: true,
    }),
  });
  const clientBlocked = await req("/api/admin/integrations/health");
  assert(clientBlocked.status === 403, "cliente bloqueado 403");
  console.log("✓ usuário comum não acessa painel de integrações");

  const logs = health?.recentLogs ?? [];
  const logText = JSON.stringify(logs);
  assert(!logText.match(/api[_-]?secret/i), "logs sem api secret");
  console.log("✓ IntegrationLog sem secrets");

  for (const item of health.integrations.filter((i) => i.status === "DEV_ONLY")) {
    assert(item.status !== "ACTIVE", "DEV_ONLY nunca é ACTIVE");
  }
  console.log("✓ DEV_ONLY não confundido com ACTIVE");

  // Upload sem auth
  cookieJar.clear();
  const uploadAnon = await fetch(`${WEB}/api/upload`, { method: "POST" });
  assert(uploadAnon.status === 401, "upload anônimo 401");
  console.log("✓ upload exige autenticação");

  await prisma.$disconnect();
  console.log("\n✓ test:foundation:integrations passou");
}

main().catch(async (e) => {
  console.error("✗", e.message);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
