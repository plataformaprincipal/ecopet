/**
 * Testes Etapa 12: Painel Gestor EcoPet + BI
 */
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, AccountStatus } from "@prisma/client";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const jars = new Map();

function jarFor(name) {
  if (!jars.has(name)) jars.set(name, new Map());
  return jars.get(name);
}

async function reqAs(jarName, path, opts = {}) {
  const jar = jarFor(jarName);
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const cookie = jar.get("cookie");
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${WEB}${path}`, { ...opts, headers });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const session = setCookie.split(";")[0];
    if (session.includes("=")) jar.set("cookie", session);
  }
  const text = await res.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data, headers: res.headers, raw: text };
}

function generateCnpj() {
  return String(Date.now()).slice(-10).padEnd(14, "0").slice(0, 14);
}

async function registerAndLogin(jarName, role, email) {
  const password = "Ecopet@Forte2026";
  const base = {
    role,
    name: `Teste ${role}`,
    email,
    password,
    confirmPassword: password,
    phone: `11${String(Date.now()).slice(-9)}`,
  };
  if (role === "CLIENT") {
    base.birthDate = "1990-01-15";
    base.username = `user${String(Date.now()).slice(-10)}`;
    base.gender = "MASCULINO";
    base.acceptTerms = true;
    base.acceptPrivacy = true;
    base.phone = `119${String(Date.now()).slice(-8)}`;
  }
  if (role === "PARTNER") {
    Object.assign(base, {
      businessName: "Loja Gestor",
      legalName: "Loja Gestor LTDA",
      cnpj: generateCnpj(),
      category: "Pet Shop",
      address: "Rua A",
      city: "SP",
      state: "SP",
    });
  }
  if (role === "ONG") {
    Object.assign(base, {
      ongName: "ONG Gestor",
      responsibleName: "Resp",
      cnpj: generateCnpj(),
      address: "Rua B",
      city: "SP",
      state: "SP",
    });
  }
  const reg = await reqAs(jarName, "/api/auth/register", { method: "POST", body: JSON.stringify(base) });
  assert(reg.status === 201, `${role} register`);
  const login = await reqAs(jarName, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert(login.status === 200, `${role} login`);
}

async function ensureAdmin(email) {
  const password = "Ecopet@Forte2026";
  const hash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Admin Gestor",
      passwordHash: hash,
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      phone: "11999990003",
    },
    update: { role: UserRole.ADMIN, accountStatus: AccountStatus.ACTIVE, passwordHash: hash },
  });
  await reqAs("admin", "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

async function main() {
  const ts = Date.now();
  console.log("=== EcoPet Foundation Gestor Tests ===\n");

  const adminEmail = `admin.gestor.${ts}@test.ecopet.local`;
  const clientEmail = `client.gestor.${ts}@test.ecopet.local`;
  const partnerEmail = `partner.gestor.${ts}@test.ecopet.local`;
  const ongEmail = `ong.gestor.${ts}@test.ecopet.local`;

  await registerAndLogin("client", "CLIENT", clientEmail);
  await registerAndLogin("partner", "PARTNER", partnerEmail);
  await registerAndLogin("ong", "ONG", ongEmail);
  await ensureAdmin(adminEmail);

  // 1-3 non-admin forbidden
  for (const [jar, label] of [
    ["client", "CLIENT"],
    ["partner", "PARTNER"],
    ["ong", "ONG"],
  ]) {
    const r = await reqAs(jar, "/api/admin/gestor/overview");
    assert(r.status === 403, `${label} não acessa gestor (403)`);
    console.log(`✓ ${label} bloqueado`);
  }

  // 4 admin overview
  const overview = await reqAs("admin", "/api/admin/gestor/overview");
  assert(overview.status === 200, "ADMIN overview 200");
  assert(overview.data.success === true, "overview success");
  assert(Array.isArray(overview.data.data?.metrics), "métricas array");
  assert(typeof overview.data.data?.metrics?.[0]?.value === "number", "métrica numérica real");
  console.log("✓ ADMIN overview métricas reais");

  // 6 users sem senha
  const users = await reqAs("admin", "/api/admin/gestor/users?limit=5");
  assert(users.status === 200, "users 200");
  const items = users.data.data?.items ?? [];
  for (const u of items) {
    assert(!("passwordHash" in u), "sem passwordHash");
    assert(!("password" in u), "sem password");
    if (u.cpfMasked) assert(String(u.cpfMasked).includes("***"), "CPF mascarado");
  }
  console.log("✓ usuários sem secrets, CPF mascarado");

  // 8 partners pendentes
  const partners = await reqAs("admin", "/api/admin/gestor/partners");
  assert(partners.status === 200, "partners 200");
  const pendingPartner = (partners.data.data?.items ?? []).find((p) => p.accountStatus === "PENDING");
  assert(pendingPartner || (partners.data.data?.metrics ?? []).some((m) => m.key === "PENDING"), "parceiros pendentes");
  if (pendingPartner?.cnpjMasked) assert(String(pendingPartner.cnpjMasked).includes("*"), "CNPJ mascarado");
  console.log("✓ parceiros e CNPJ mascarado");

  // 9-12 status aggregates
  for (const ep of ["orders", "products", "services", "appointments"]) {
    const r = await reqAs("admin", `/api/admin/gestor/${ep}`);
    assert(r.status === 200, `${ep} 200`);
    assert(r.data.data?.metrics !== undefined || r.data.data?.items !== undefined, `${ep} dados`);
    console.log(`✓ ${ep} retorna dados`);
  }

  // 13-14 social
  const social = await reqAs("admin", "/api/admin/gestor/social");
  assert(social.status === 200, "social 200");
  assert(Array.isArray(social.data.data?.metrics), "social metrics");
  const mod = await reqAs("admin", "/api/admin/gestor/moderation");
  assert(mod.status === 200, "moderation 200");
  console.log("✓ social e denúncias");

  // 15 support
  const support = await reqAs("admin", "/api/admin/gestor/support");
  assert(support.status === 200, "support 200");
  console.log("✓ tickets suporte");

  // 16 integrations
  const integrations = await reqAs("admin", "/api/admin/gestor/integrations");
  assert(integrations.status === 200, "integrations 200");
  assert(Array.isArray(integrations.data.data?.integrations), "integrations array");
  console.log("✓ integrações status real");

  // 17 audit sem secrets
  const audit = await reqAs("admin", "/api/admin/gestor/audit?limit=5");
  assert(audit.status === 200, "audit 200");
  const logs = audit.data.data?.items ?? [];
  const serialized = JSON.stringify(logs);
  assert(!/password|secret|token/i.test(serialized) || /\[REDACTED\]/.test(serialized), "audit sem secrets expostos");
  console.log("✓ audit logs seguros");

  // 18-19 export CSV + audit
  const beforeExportCount = await prisma.auditLog.count({ where: { module: "gestor.reports", action: "EXPORT" } });
  const exp = await reqAs("admin", "/api/admin/gestor/reports/export", {
    method: "POST",
    body: JSON.stringify({ type: "users", limit: 10 }),
  });
  assert(exp.status === 200, "export 200");
  assert(exp.raw.includes("email") || exp.raw === "no_data\n", "csv export");
  const afterExportCount = await prisma.auditLog.count({ where: { module: "gestor.reports", action: "EXPORT" } });
  assert(afterExportCount > beforeExportCount, "export registra AuditLog");
  console.log("✓ exportação CSV e AuditLog");

  // 20 non-admin 403 again
  const forbidden = await reqAs("client", "/api/admin/gestor/users");
  assert(forbidden.status === 403, "403 non-admin");
  console.log("✓ 403 non-admin");

  // 21 invalid filters
  const badFilter = await reqAs("admin", "/api/admin/gestor/users?page=0");
  assert(badFilter.status === 400, "filtro inválido 400");
  console.log("✓ filtros inválidos");

  // 22 limit max
  const bigLimit = await reqAs("admin", "/api/admin/gestor/users?limit=500");
  assert(bigLimit.status === 400, "limit acima máximo bloqueado");
  console.log("✓ limit máximo");

  // 23 quality
  const quality = await reqAs("admin", "/api/admin/gestor/quality");
  assert(quality.status === 200, "quality 200");
  assert(Array.isArray(quality.data.data?.alerts), "alertas qualidade");
  console.log("✓ qualidade operacional");

  // 24 system-health
  const health = await reqAs("admin", "/api/admin/gestor/system-health");
  assert(health.status === 200, "system-health 200");
  const healthStr = JSON.stringify(health.data.data);
  assert(!healthStr.includes("STRIPE_SECRET"), "sem secrets system-health");
  assert(health.data.data?.databaseConnected === true, "db connected");
  console.log("✓ system-health seguro");

  console.log("\n✓ Todos os 24 testes do Gestor passaram.");
}

main()
  .catch((e) => {
    console.error("\n✗", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
