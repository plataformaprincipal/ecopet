/**
 * Testes de segurança — Etapa 13 (RBAC, headers, rate limit, IDOR)
 */
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, AccountStatus } from "@prisma/client";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const PASSWORD = "Ecopet@Forte2026";
const TEST_RUN_IP_BASE = `10.254.${Date.now() % 200}`;

function testIpFor(jarName) {
  let h = 0;
  for (const c of jarName) h = (h * 31 + c.charCodeAt(0)) % 200;
  return `${TEST_RUN_IP_BASE}.${h + 1}`;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function phone(suffix) {
  return `119${String(suffix).padStart(8, "0").slice(-8)}`;
}

function cnpj(seed) {
  const base = String(seed).replace(/\D/g, "").slice(-10).padEnd(10, "0");
  return `${base}${String(Date.now() % 10000).padStart(4, "0")}`.slice(0, 14);
}

const jars = new Map();
function jar(name) {
  if (!jars.has(name)) jars.set(name, new Map());
  return jars.get(name);
}

async function reqAs(jarName, path, opts = {}) {
  const j = jar(jarName);
  const headers = {
    "Content-Type": "application/json",
    "x-forwarded-for": opts.testIp ?? testIpFor(jarName),
    ...(opts.headers || {}),
  };
  const cookie = j.get("cookie");
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${WEB}${path}`, { ...opts, headers });
  const setCookie = res.headers.get("set-cookie");
  const setCookies =
    typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : setCookie ? [setCookie] : [];
  for (const raw of setCookies) {
    const session = raw.split(";")[0];
    if (session.includes("ecopet-session=")) j.set("cookie", session);
    if (raw.includes("Max-Age=0") || raw.includes("max-age=0")) j.delete("cookie");
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, headers: res.headers };
}

async function registerUser(jarName, role, email, extra = {}) {
  const base = {
    role,
    name: `Sec ${role}`,
    email,
    password: PASSWORD,
    confirmPassword: PASSWORD,
    phone: phone(email.length + Date.now()),
    ...extra,
  };
  if (role === "CLIENT") {
    base.birthDate = "1990-01-01";
    base.username = `user${String(Date.now()).slice(-10)}`;
    base.gender = "MASCULINO";
    base.acceptTerms = true;
    base.acceptPrivacy = true;
  }
  if (role === "PARTNER") {
    Object.assign(base, {
      businessName: "Loja Sec",
      legalName: "Loja Sec LTDA",
      cnpj: cnpj(email),
      category: "Pet Shop",
      address: "Rua A",
      city: "SP",
      state: "SP",
    });
  }
  const reg = await reqAs(jarName, "/api/auth/register", { method: "POST", body: JSON.stringify(base) });
  assert(reg.status === 201, `register ${role} ${reg.status}`);
  const login = await reqAs(jarName, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  assert(login.status === 200, `login ${role} ${login.status}`);
  const user = login.data.data?.user;
  assert(user?.id, `${role} user id ausente`);
  return user;
}

async function ensureAdmin(email) {
  const hash = await bcrypt.hash(PASSWORD, 12);
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Sec Admin",
      passwordHash: hash,
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      phone: phone(90004),
    },
    update: { role: UserRole.ADMIN, passwordHash: hash, accountStatus: AccountStatus.ACTIVE },
  });
  const login = await reqAs("admin", "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  assert(login.status === 200, `admin login ${login.status}`);
  const adminUser = await prisma.user.findUnique({ where: { email } });
  return adminUser;
}

async function activateUser(userId) {
  await prisma.user.update({ where: { id: userId }, data: { accountStatus: AccountStatus.ACTIVE } });
}

async function main() {
  const ts = Date.now();
  console.log("=== EcoPet Security Tests ===\n");

  const clientAEmail = `sec.clientA.${ts}@test.ecopet.local`;
  const clientBEmail = `sec.clientB.${ts}@test.ecopet.local`;
  const partnerAEmail = `sec.partnerA.${ts}@test.ecopet.local`;
  const partnerBEmail = `sec.partnerB.${ts}@test.ecopet.local`;
  const adminEmail = `sec.admin.${ts}@test.ecopet.local`;

  const clientA = await registerUser("clientA", "CLIENT", clientAEmail);
  const clientB = await registerUser("clientB", "CLIENT", clientBEmail);
  const partnerAUser = await registerUser("partnerA", "PARTNER", partnerAEmail);
  const partnerBUser = await registerUser("partnerB", "PARTNER", partnerBEmail);
  await activateUser(partnerAUser.id);
  await activateUser(partnerBUser.id);
  await reqAs("partnerA", "/api/auth/login", { method: "POST", body: JSON.stringify({ email: partnerAEmail, password: PASSWORD }) });
  await reqAs("partnerB", "/api/auth/login", { method: "POST", body: JSON.stringify({ email: partnerBEmail, password: PASSWORD }) });
  const admin = await ensureAdmin(adminEmail);

  // --- RBAC ---
  const gestorClient = await reqAs("clientA", "/api/admin/gestor/overview");
  assert(gestorClient.status === 403, `CLIENT bloqueado no admin (got ${gestorClient.status})`);
  console.log("✓ CLIENT bloqueado no admin");

  const privacyClient = await reqAs("clientA", "/api/admin/privacy-requests");
  assert(privacyClient.status === 403, `CLIENT bloqueado em privacy-requests (${privacyClient.status})`);
  console.log("✓ CLIENT bloqueado em rotas admin LGPD");

  const privacyAdmin = await reqAs("admin", "/api/admin/privacy-requests");
  assert(privacyAdmin.status === 200, `admin privacy-requests (${privacyAdmin.status})`);
  console.log("✓ ADMIN acessa privacy-requests (rota auditada)");

  const gestorAdmin = await reqAs("admin", "/api/admin/gestor/overview");
  assert(gestorAdmin.status === 200, `admin gestor overview (${gestorAdmin.status})`);
  console.log("✓ ADMIN acessa gestor overview (rota auditada)");

  // --- passwordHash / secrets ---
  const me = await reqAs("clientA", "/api/auth/me");
  assert(me.status === 200, "me ok");
  assert(!("passwordHash" in (me.data.data?.user ?? {})), "sem passwordHash");
  assert(!JSON.stringify(me.data).includes("passwordHash"), "resposta sem passwordHash");
  console.log("✓ API sem passwordHash");

  const loginBody = JSON.stringify(me.data);
  assert(!loginBody.includes("JWT_SECRET"), "sem JWT_SECRET");
  console.log("✓ sem secrets na resposta");

  // --- IDOR: pet ---
  const petCreate = await reqAs("clientA", "/api/client/pets", {
    method: "POST",
    body: JSON.stringify({ name: `SecPetA-${ts}`, species: "DOG", weight: 10 }),
  });
  assert(petCreate.status === 201, `create pet ${petCreate.status}`);
  const petId = petCreate.data.data.pet.id;

  const petReadB = await reqAs("clientB", `/api/client/pets/${petId}`);
  assert(petReadB.status === 404, `IDOR pet read (${petReadB.status})`);
  console.log("✓ IDOR: usuário não acessa pet de terceiro");

  const petEditB = await reqAs("clientB", `/api/client/pets/${petId}`, {
    method: "PUT",
    body: JSON.stringify({ name: "Hack", species: "DOG" }),
  });
  assert(petEditB.status === 404, `IDOR pet edit (${petEditB.status})`);
  console.log("✓ IDOR: usuário não edita pet de terceiro");

  // --- IDOR: pedido (cliente) ---
  const orderNumber = Number(String(ts).slice(-7)) + 1000;
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: clientA.id,
      partnerId: partnerAUser.id,
      total: 49.9,
      shippingAddress: { street: "Rua Teste", city: "SP", state: "SP" },
      status: "PENDING",
    },
  });

  const orderReadB = await reqAs("clientB", `/api/client/orders/${order.id}`);
  assert(orderReadB.status === 404, `IDOR order client read (${orderReadB.status})`);
  console.log("✓ IDOR: usuário não acessa pedido de terceiro");

  // --- IDOR: pedido (parceiro) ---
  const orderPartnerB = await reqAs("partnerB", `/api/partner/orders/${order.id}`);
  assert(orderPartnerB.status === 404, `IDOR order partner read (${orderPartnerB.status})`);
  console.log("✓ IDOR: parceiro não acessa pedido de outro parceiro");

  const orderPartnerA = await reqAs("partnerA", `/api/partner/orders/${order.id}`);
  assert(orderPartnerA.status === 200, `partner owner read (${orderPartnerA.status})`);

  // --- IDOR: conversa ---
  const conversation = await prisma.conversation.create({
    data: {
      type: "CLIENT_ECOPET",
      createdById: clientA.id,
      participants: {
        create: [{ userId: clientA.id }, { userId: admin.id }],
      },
    },
  });

  const convReadB = await reqAs("clientB", `/api/messages/conversations/${conversation.id}`);
  assert(convReadB.status === 403, `IDOR conversation read (${convReadB.status})`);
  console.log("✓ IDOR: usuário não acessa conversa de terceiro");

  const convMsgsB = await reqAs("clientB", `/api/messages/conversations/${conversation.id}/messages`);
  assert(convMsgsB.status === 403, `IDOR conversation messages (${convMsgsB.status})`);

  const convSendB = await reqAs("clientB", `/api/messages/conversations/${conversation.id}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: "intrusão" }),
  });
  assert(convSendB.status === 403, `IDOR send message (${convSendB.status})`);
  console.log("✓ IDOR: usuário não envia mensagem em conversa de terceiro");

  // --- IDOR: social post / comment ---
  const postCreate = await reqAs("clientA", "/api/social/posts", {
    method: "POST",
    body: JSON.stringify({ content: `Post seguro ${ts}`, visibility: "PUBLIC" }),
  });
  assert(postCreate.status === 201, `create post ${postCreate.status}`);
  const postId = postCreate.data.data.post.id;

  const postEditB = await reqAs("clientB", `/api/social/posts/${postId}`, {
    method: "PATCH",
    body: JSON.stringify({ content: "hackeado" }),
  });
  assert(postEditB.status === 403, `IDOR post edit (${postEditB.status})`);
  console.log("✓ IDOR: usuário não edita post de terceiro");

  const commentCreate = await reqAs("clientA", `/api/social/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content: `Comentário ${ts}` }),
  });
  assert(commentCreate.status === 201, `create comment ${commentCreate.status}`);
  const commentId = commentCreate.data.data.comment.id;

  const commentDelB = await reqAs("clientB", `/api/social/comments/${commentId}`, { method: "DELETE" });
  assert(commentDelB.status === 403, `IDOR comment delete (${commentDelB.status})`);
  console.log("✓ IDOR: usuário não apaga comentário de terceiro");

  // --- IDOR: export LGPD (sessão própria apenas) ---
  const exportA = await reqAs("clientA", "/api/account/export-data");
  assert(exportA.status === 200, "export clientA");
  const exportAStr = JSON.stringify(exportA.data);
  assert(exportAStr.includes(`SecPetA-${ts}`), "exportA contém pet próprio");
  assert(!exportAStr.includes("passwordHash"), "exportA sem passwordHash");

  await reqAs("clientB", "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: clientBEmail, password: PASSWORD }),
  });
  const meB = await reqAs("clientB", "/api/auth/me");
  assert(meB.status === 200, "me clientB");
  const exportB = await reqAs("clientB", "/api/account/export-data");
  assert(exportB.status === 200, "export clientB");
  const exportBStr = JSON.stringify(exportB.data);
  assert(!exportBStr.includes(`SecPetA-${ts}`), "exportB não contém pet de terceiro");
  assert(!exportBStr.includes(clientAEmail), "exportB não contém e-mail de terceiro");
  assert(exportB.data?.data?.profile?.id === meB.data?.data?.user?.id, "exportB é do próprio usuário");
  console.log("✓ IDOR: export LGPD isolado por sessão");

  // --- headers ---
  const pageRes = await fetch(`${WEB}/login`);
  const xcto = pageRes.headers.get("x-content-type-options");
  assert(xcto === "nosniff", "X-Content-Type-Options");
  console.log("✓ security headers presentes");

  // --- system-health sem secrets ---
  const health = await reqAs("admin", "/api/admin/gestor/system-health");
  const hs = JSON.stringify(health.data);
  assert(!hs.includes("SMTP_PASS"), "system-health sem SMTP_PASS");
  console.log("✓ system-health sem secrets");

  const integrations = await reqAs("admin", "/api/admin/integrations/health");
  assert(integrations.status === 200, "integrations health");
  console.log("✓ integrações health ok");

  // --- LGPD request ---
  const del = await reqAs("clientA", "/api/account/request-deletion", {
    method: "POST",
    body: JSON.stringify({ description: "teste segurança" }),
  });
  assert(del.status === 200, "request-deletion 200");
  console.log("✓ solicitação LGPD registrada");

  // --- rate limit login (por último, IP dedicado) ---
  let blocked = false;
  const rateIp = `test-rate-${ts}`;
  for (let i = 0; i < 12; i++) {
    const r = await fetch(`${WEB}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": rateIp },
      body: JSON.stringify({ email: `rate.${ts}@test.ecopet.local`, password: "x" }),
    });
    if (r.status === 429) {
      blocked = true;
      break;
    }
  }
  assert(blocked, "rate limit login");
  console.log("✓ rate limit login");

  console.log("\n✓ Todos os testes de segurança passaram.");
}

main()
  .catch((e) => {
    console.error("\n✗", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
