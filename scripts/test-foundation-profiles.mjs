/**
 * Testes Etapa 4: perfis, status de conta, aprovação admin, recuperação de senha.
 */
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, AccountStatus } from "@prisma/client";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const cookieJar = new Map();

function generateResetToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function resetExpiresAt(from = new Date()) {
  return new Date(from.getTime() + 30 * 60 * 1000);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function generateCnpj() {
  return String(Date.now()).slice(-10).padEnd(14, "0").slice(0, 14);
}

async function req(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const cookie = cookieJar.get("cookie");
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(`${WEB}${path}`, { ...opts, headers, redirect: "manual" });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const session = setCookie.split(";")[0];
    if (session.includes("=")) cookieJar.set("cookie", session);
    if (setCookie.includes("Max-Age=0") || setCookie.includes("max-age=0")) cookieJar.delete("cookie");
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, headers: res.headers };
}

async function register(role, email, extra = {}) {
  const password = "Ecopet@Forte2026";
  const base = {
    role,
    name: "Teste " + role,
    email,
    password,
    confirmPassword: password,
    phone: `11${String(Date.now()).slice(-9)}`,
    ...extra,
  };
  if (role === "CLIENT") base.birthDate = "1990-01-15";
  if (role === "PARTNER") {
    const cnpj = generateCnpj();
    Object.assign(base, {
      businessName: "Loja Teste",
      legalName: "Loja Teste LTDA",
      cnpj,
      category: "Pet Shop",
      address: "Rua A",
      city: "SP",
      state: "SP",
    });
  }
  if (role === "ONG") {
    const cnpj = generateCnpj();
    Object.assign(base, {
      ongName: "ONG Teste",
      responsibleName: "Resp ONG",
      cnpj,
      address: "Rua B",
      city: "SP",
      state: "SP",
    });
  }
  return req("/api/auth/register", { method: "POST", body: JSON.stringify(base) });
}

async function ensureAdmin(email, password) {
  const hash = await bcrypt.hash(password, 12);
  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Admin Teste",
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
  const adminEmail = `admin.${ts}@test.ecopet.local`;

  console.log("=== EcoPet Foundation Profiles Tests ===\n");

  // 1. CLIENT ACTIVE
  cookieJar.clear();
  const client = await register("CLIENT", `client.p.${ts}@test.ecopet.local`);
  assert(client.status === 201, "client register 201");
  const meClient = await req("/api/auth/me");
  assert(meClient.data.data?.user?.accountStatus === "ACTIVE", "client ACTIVE");

  // 2. PARTNER PENDING
  cookieJar.clear();
  const partner = await register("PARTNER", `partner.p.${ts}@test.ecopet.local`);
  assert(partner.status === 201, "partner register 201");
  const mePartner = await req("/api/auth/me");
  assert(mePartner.data.data?.user?.accountStatus === "PENDING", "partner PENDING");

  // 3. ONG PENDING
  cookieJar.clear();
  const ong = await register("ONG", `ong.p.${ts}@test.ecopet.local`);
  assert(ong.status === 201, "ong register 201");
  const meOng = await req("/api/auth/me");
  assert(meOng.data.data?.user?.accountStatus === "PENDING", "ong PENDING");

  // 4. PARTNER PENDING blocked from marketplace (middleware redirect)
  cookieJar.clear();
  await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: `partner.p.${ts}@test.ecopet.local`, password }),
  });
  const partnerMarket = await fetch(`${WEB}/marketplace`, {
    headers: { Cookie: cookieJar.get("cookie") ?? "" },
    redirect: "manual",
  });
  assert(partnerMarket.status === 307 || partnerMarket.status === 302, "partner pending redirect marketplace");
  const loc = partnerMarket.headers.get("location") ?? "";
  assert(loc.includes("/conta/em-analise"), "redirect em-analise");

  // 5. ONG PENDING blocked from adocao
  cookieJar.clear();
  await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: `ong.p.${ts}@test.ecopet.local`, password }),
  });
  const ongAdocao = await fetch(`${WEB}/adocao`, {
    headers: { Cookie: cookieJar.get("cookie") ?? "" },
    redirect: "manual",
  });
  assert(ongAdocao.status === 307 || ongAdocao.status === 302, "ong pending redirect adocao");

  // 6-8. Admin approval flow
  const admin = await ensureAdmin(adminEmail, password);
  cookieJar.clear();
  const adminLogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: adminEmail, password }),
  });
  assert(adminLogin.status === 200, "admin login");

  const pendingList = await req("/api/admin/accounts");
  assert(pendingList.status === 200, "admin list accounts");
  assert(pendingList.data.data?.partners?.length >= 1, "pending partners listed");

  const partnerId = partner.data.data?.user?.id ?? mePartner.data.data?.user?.id;
  const ongId = ong.data.data?.user?.id ?? meOng.data.data?.user?.id;

  const approvePartner = await req(`/api/admin/accounts/${partnerId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "approve" }),
  });
  assert(approvePartner.status === 200, "approve partner");

  const rejectOng = await req(`/api/admin/accounts/${ongId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "reject", reason: "Documentação incompleta" }),
  });
  assert(rejectOng.status === 200, "reject ong");

  // 9. SUSPENDED block at login
  const suspendedEmail = `suspended.${ts}@test.ecopet.local`;
  await prisma.user.create({
    data: {
      email: suspendedEmail,
      name: "Suspenso",
      passwordHash: await bcrypt.hash(password, 12),
      role: UserRole.CLIENT,
      accountStatus: AccountStatus.SUSPENDED,
      phone: `11${String(ts).slice(-8)}`,
    },
  });
  const suspendedLogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: suspendedEmail, password }),
  });
  assert(suspendedLogin.status === 403, "suspended login blocked");

  // 10. CLIENT profile edit
  cookieJar.clear();
  await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: `client.p.${ts}@test.ecopet.local`, password }),
  });
  const profilePut = await req("/api/profile/me", {
    method: "PUT",
    body: JSON.stringify({
      name: "Cliente Atualizado",
      phone: "11987654321",
      birthDate: "1990-01-15",
      address: "Rua Nova 100",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310100",
    }),
  });
  assert(profilePut.status === 200, "client profile update");
  assert(profilePut.data.success === true, "client profile success");

  // 11-12. PARTNER/ONG profile — login partner after approve
  cookieJar.clear();
  await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: `partner.p.${ts}@test.ecopet.local`, password }),
  });
  const partnerUser = await prisma.user.findUnique({
    where: { email: `partner.p.${ts}@test.ecopet.local` },
    include: { partnerProfile: true },
  });
  const partnerProfile = await req("/api/profile/me", {
    method: "PUT",
    body: JSON.stringify({
      businessName: "Loja Atualizada",
      legalName: partnerUser?.partnerProfile?.legalName ?? "Loja Teste LTDA",
      cnpj: partnerUser?.partnerProfile?.cnpj ?? generateCnpj(),
      category: "Pet Shop",
      phone: "11987654322",
      commercialEmail: `partner.p.${ts}@test.ecopet.local`,
      responsibleName: "Resp",
      address: "Rua C",
      city: "SP",
      state: "SP",
      zipCode: "01310100",
    }),
  });
  assert(partnerProfile.status === 200, "partner profile update");

  // Cleanup note: test users use @test.ecopet.local
  cookieJar.clear();
  const forgot = await req("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: `client.p.${ts}@test.ecopet.local` }),
  });
  assert(forgot.status === 200, "forgot password");
  assert(forgot.data.success === true, "forgot success shape");

  const userRow = await prisma.user.findUnique({ where: { email: `client.p.${ts}@test.ecopet.local` } });
  const tokenRow = await prisma.passwordResetToken.findFirst({
    where: { userId: userRow.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  assert(tokenRow, "reset token created in db");

  // Simulate token for test (we have hash only — create known token)
  const plainToken = generateResetToken();
  const tokenHash = hashResetToken(plainToken);
  await prisma.passwordResetToken.create({
    data: {
      userId: userRow.id,
      tokenHash,
      expiresAt: resetExpiresAt(),
    },
  });

  const reset = await req("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token: plainToken,
      password: "Nova@Senha2026!",
      confirmPassword: "Nova@Senha2026!",
    }),
  });
  assert(reset.status === 200, "reset password ok");

  const usedReset = await req("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token: plainToken,
      password: "Nova@Senha2026!",
      confirmPassword: "Nova@Senha2026!",
    }),
  });
  assert(usedReset.status === 400, "used token rejected");

  const expiredToken = generateResetToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: userRow.id,
      tokenHash: hashResetToken(expiredToken),
      expiresAt: new Date(Date.now() - 60_000),
    },
  });
  const expiredReset = await req("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token: expiredToken,
      password: "Nova@Senha2026!",
      confirmPassword: "Nova@Senha2026!",
    }),
  });
  assert(expiredReset.status === 400, "expired token rejected");

  console.log("\n✓ Todos os testes de perfis/fundacao passaram.");
}

main()
  .catch((e) => {
    console.error("\n✗", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
