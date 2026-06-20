/**
 * Testes Etapa 10: chat, direct, suporte, moderação e bloqueio.
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
    if (setCookie.includes("Max-Age=0") || setCookie.includes("max-age=0")) jar.delete("cookie");
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function generateCnpj() {
  return String(Date.now()).slice(-10).padEnd(14, "0").slice(0, 14);
}

async function reqMultipartAs(jarName, path, formData) {
  const jar = jarFor(jarName);
  const headers = {};
  const cookie = jar.get("cookie");
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${WEB}${path}`, { method: "POST", headers, body: formData });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const session = setCookie.split(";")[0];
    if (session.includes("=")) jar.set("cookie", session);
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function registerAndLogin(jarName, role, email, extra = {}) {
  const password = "Ecopet@Forte2026";
  const base = {
    role,
    name: `Teste ${role}`,
    email,
    password,
    confirmPassword: password,
    phone: `11${String(Date.now()).slice(-9)}`,
    ...extra,
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
    const cnpj = generateCnpj();
    Object.assign(base, {
      businessName: "Loja Chat",
      legalName: "Loja Chat LTDA",
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
      ongName: "ONG Chat",
      responsibleName: "Resp",
      cnpj,
      address: "Rua B",
      city: "SP",
      state: "SP",
    });
  }
  const reg = await reqAs(jarName, "/api/auth/register", { method: "POST", body: JSON.stringify(base) });
  assert(reg.status === 201, `${role} register 201`);
  const login = await reqAs(jarName, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert(login.status === 200, `${role} login`);
  return login.data.data?.user;
}

async function ensureAdmin(email) {
  const password = "Ecopet@Forte2026";
  const hash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Admin Chat",
      passwordHash: hash,
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      phone: "11999990001",
    },
    update: { role: UserRole.ADMIN, accountStatus: AccountStatus.ACTIVE, passwordHash: hash },
  });
  await reqAs("admin", "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return admin;
}

async function activateUser(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { accountStatus: AccountStatus.ACTIVE },
  });
}

async function main() {
  const ts = Date.now();
  console.log("=== EcoPet Foundation Chat Tests ===\n");

  const health = await reqAs("guest", "/api/health");
  assert(health.status === 200, "health ok");

  const client = await registerAndLogin("client", "CLIENT", `chat.client.${ts}@test.ecopet.local`);
  const partner = await registerAndLogin("partner", "PARTNER", `chat.partner.${ts}@test.ecopet.local`);
  const ong = await registerAndLogin("ong", "ONG", `chat.ong.${ts}@test.ecopet.local`);
  await activateUser(partner.id);
  await activateUser(ong.id);

  const adminEmail = `chat.admin.${ts}@test.ecopet.local`;
  const admin = await ensureAdmin(adminEmail);

  // 1 CLIENT + PARTNER
  const cp = await reqAs("client", "/api/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ type: "CLIENT_PARTNER", participantUserIds: [partner.id] }),
  });
  assert(cp.status === 201, "CLIENT cria conversa PARTNER");
  const convCP = cp.data.data?.conversation?.id;

  // 2 CLIENT + ONG
  const co = await reqAs("client", "/api/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ type: "CLIENT_ONG", participantUserIds: [ong.id] }),
  });
  assert(co.status === 201, "CLIENT cria conversa ONG");

  // 3 DIRECT
  const direct = await reqAs("client", "/api/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ type: "DIRECT", participantUserIds: [partner.id] }),
  });
  assert(direct.status === 201, "DIRECT funciona");
  const convDirect = direct.data.data?.conversation?.id;

  // 4 duplicata DIRECT
  const dup = await reqAs("client", "/api/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ type: "DIRECT", participantUserIds: [partner.id] }),
  });
  assert(dup.status === 201, "duplicata retorna existente");
  assert(dup.data.data?.conversation?.id === convDirect, "mesma conversa DIRECT");

  // 5 não conversa consigo
  const self = await reqAs("client", "/api/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ type: "DIRECT", participantUserIds: [client.id] }),
  });
  assert(self.status === 400, "não cria consigo mesmo");

  // 6 PENDING não inicia
  const pendingEmail = `chat.pending.${ts}@test.ecopet.local`;
  await registerAndLogin("pending", "PARTNER", pendingEmail);
  const pendingConv = await reqAs("pending", "/api/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ type: "DIRECT", participantUserIds: [client.id] }),
  });
  assert(pendingConv.status === 403, "PENDING não inicia conversa");

  // 7 SUSPENDED não envia
  await prisma.user.update({ where: { id: client.id }, data: { accountStatus: AccountStatus.SUSPENDED } });
  const suspendedSend = await reqAs("client", `/api/messages/conversations/${convCP}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: "teste" }),
  });
  assert(suspendedSend.status === 403, "SUSPENDED não envia");
  await prisma.user.update({ where: { id: client.id }, data: { accountStatus: AccountStatus.ACTIVE } });

  // 8 vê apenas suas conversas
  const listClient = await reqAs("client", "/api/messages/conversations");
  assert(listClient.status === 200, "lista conversas");
  assert(listClient.data.data?.items?.length >= 2, "client vê conversas");

  // 9 não acessa alheia — criar conversa só partner+ong sem client
  const privateConv = await reqAs("partner", "/api/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ type: "DIRECT", participantUserIds: [ong.id] }),
  });
  const privateId = privateConv.data.data?.conversation?.id;
  const forbidden = await reqAs("client", `/api/messages/conversations/${privateId}`);
  assert(forbidden.status === 403, "não acessa conversa alheia");

  // 10 envia mensagem
  const send = await reqAs("client", `/api/messages/conversations/${convCP}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: "Olá parceiro!" }),
  });
  assert(send.status === 201, "envia mensagem");
  const messageId = send.data.data?.message?.id;

  // 11 vazia recusada
  const empty = await reqAs("client", `/api/messages/conversations/${convCP}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: "   " }),
  });
  assert(empty.status === 400, "mensagem vazia recusada");

  // 12 muito longa
  const long = await reqAs("client", `/api/messages/conversations/${convCP}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: "x".repeat(5000) }),
  });
  assert(long.status === 400, "mensagem longa recusada");

  // 13 lastMessageAt
  const convDetail = await reqAs("client", `/api/messages/conversations/${convCP}`);
  assert(convDetail.data.data?.conversation?.lastMessageAt, "lastMessageAt atualizado");

  // 14 notification criada
  const notif = await prisma.notification.findFirst({
    where: { userId: partner.id, type: "MESSAGE_RECEIVED" },
    orderBy: { createdAt: "desc" },
  });
  assert(notif, "notification MESSAGE_RECEIVED");

  // 15 marca lida
  const read = await reqAs("partner", `/api/messages/conversations/${convCP}/read`, { method: "PATCH" });
  assert(read.status === 200, "marca lida");

  // 16 unread
  const listPartner = await reqAs("partner", "/api/messages/conversations");
  const item = listPartner.data.data?.items?.find((i) => i.id === convCP);
  assert(item && item.unreadCount === 0, "unreadCount após leitura");

  // 17 edita própria
  const edit = await reqAs("client", `/api/messages/${messageId}`, {
    method: "PATCH",
    body: JSON.stringify({ content: "Olá parceiro editado!" }),
  });
  assert(edit.status === 200, "edita mensagem própria");

  // 18 não edita alheia
  const editOther = await reqAs("partner", `/api/messages/${messageId}`, {
    method: "PATCH",
    body: JSON.stringify({ content: "hack" }),
  });
  assert(editOther.status === 403, "não edita alheia");

  // 19 soft delete
  const del = await reqAs("client", `/api/messages/${messageId}`, { method: "DELETE" });
  assert(del.status === 200, "soft delete própria");
  assert(del.data.data?.message?.isDeleted === true, "marcada deletada");

  // 20 anexo em dev (upload + mensagem com attachment)
  const pngBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  const form = new FormData();
  form.append("purpose", "chat_attachment");
  form.append("file", new File([pngBytes], "test.png", { type: "image/png" }));
  const upload = await reqMultipartAs("client", "/api/upload", form);
  assert(upload.status === 201, "upload anexo dev 201");
  const uploaded = upload.data.data?.upload;
  assert(uploaded?.url, "upload retorna url");
  const attachSend = await reqAs("client", `/api/messages/conversations/${convCP}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content: "Com anexo",
      attachments: [
        {
          fileName: "test.png",
          fileUrl: uploaded.url,
          mimeType: uploaded.mimeType,
          fileSize: uploaded.sizeBytes,
          storageProvider: uploaded.provider ?? "local_dev",
        },
      ],
    }),
  });
  assert(attachSend.status === 201, "mensagem com anexo");
  assert(attachSend.data.data?.message?.attachments?.length >= 1, "anexo persistido");

  // 21 upload inválido / não configurado
  const badForm = new FormData();
  badForm.append("purpose", "chat_attachment");
  badForm.append("file", new File(["texto"], "bad.txt", { type: "text/plain" }));
  const badUpload = await reqMultipartAs("client", "/api/upload", badForm);
  assert(badUpload.status === 400, "tipo inválido recusado no upload");
  const healthUpload = await reqAs("guest", "/api/health");
  const uploadInt = healthUpload.data.data?.integrations?.find((i) =>
    ["upload", "upload_local_dev", "cloudinary"].includes(i.name)
  );
  if (uploadInt?.status === "DISABLED" && !uploadInt?.canRunInProduction) {
    const noUpload = await reqMultipartAs("client", "/api/upload", form);
    assert(
      noUpload.status === 503 || noUpload.data.error?.code === "UPLOAD_NOT_CONFIGURED",
      "UPLOAD_NOT_CONFIGURED quando provedor ausente"
    );
  }

  // 22 denuncia
  const msg2 = await reqAs("partner", `/api/messages/conversations/${convCP}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: "resposta" }),
  });
  const msg2Id = msg2.data.data?.message?.id;
  const report = await reqAs("client", `/api/messages/${msg2Id}/report`, {
    method: "POST",
    body: JSON.stringify({ reason: "spam", description: "teste" }),
  });
  assert(report.status === 201, "denuncia mensagem");

  // 23 admin revisa
  const reports = await reqAs("admin", "/api/admin/messages/reports");
  assert(reports.status === 200, "admin lista denúncias");
  const reportId = reports.data.data?.items?.[0]?.id;
  const review = await reqAs("admin", `/api/admin/messages/reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "RESOLVED", resolution: "ok" }),
  });
  assert(review.status === 200, "admin revisa denúncia");

  // 24 bloqueio
  const block = await reqAs("client", `/api/messages/users/${partner.id}/block`, {
    method: "POST",
    body: JSON.stringify({ reason: "teste" }),
  });
  assert(block.status === 201, "bloqueia usuário");

  // 25 bloqueado não envia direct
  const newDirect = await reqAs("client", "/api/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ type: "DIRECT", participantUserIds: [partner.id] }),
  });
  const blockedSend = await reqAs("client", `/api/messages/conversations/${newDirect.data.data?.conversation?.id}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: "após bloqueio" }),
  });
  assert(blockedSend.status === 403, "bloqueado não envia");

  // 26 suporte ticket — desbloquear antes
  await reqAs("client", `/api/messages/users/${partner.id}/block`, { method: "DELETE" });
  const ticket = await reqAs("client", "/api/support/tickets", {
    method: "POST",
    body: JSON.stringify({ subject: "Ajuda", description: "Preciso de suporte", category: "TECHNICAL" }),
  });
  assert(ticket.status === 201, "cria ticket suporte");
  const ticketId = ticket.data.data?.ticket?.id;

  // 27 admin assume
  const assign = await reqAs("admin", `/api/support/tickets/${ticketId}/messages`, {
    method: "PATCH",
    body: JSON.stringify({ action: "assign" }),
  });
  assert(assign.status === 200, "admin assume ticket");

  // 28 admin responde
  const ticketMsg = await reqAs("admin", `/api/support/tickets/${ticketId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: "Olá, como posso ajudar?" }),
  });
  assert(ticketMsg.status === 201, "admin responde ticket");

  // 29 usuário fecha
  const close = await reqAs("client", `/api/support/tickets/${ticketId}/messages`, {
    method: "PATCH",
    body: JSON.stringify({ status: "CLOSED" }),
  });
  assert(close.status === 200, "usuário fecha ticket");

  // 30 admin vê tickets
  const adminTickets = await reqAs("admin", "/api/admin/support/tickets");
  assert(adminTickets.status === 200, "admin vê tickets");
  assert(adminTickets.data.data?.items?.length >= 1, "admin tickets list");

  console.log("\n✅ Foundation chat tests passed");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("\n❌", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
