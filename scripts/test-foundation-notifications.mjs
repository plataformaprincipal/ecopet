/**
 * Testes: Central de Notificações EcoPet
 */
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, AccountStatus } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const jars = new Map();
function jarFor(name) {
  if (!jars.has(name)) jars.set(name, new Map());
  return jars.get(name);
}

async function reqAs(jarName, urlPath, opts = {}) {
  const jar = jarFor(jarName);
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const cookie = jar.get("cookie");
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${WEB}${urlPath}`, { ...opts, headers });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const session = setCookie.split(";")[0];
    if (session.includes("=")) jar.set("cookie", session);
    if (setCookie.includes("Max-Age=0") || setCookie.includes("max-age=0")) jar.delete("cookie");
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function createUserDirect(jarName, role, email) {
  const password = "Ecopet@Forte2026";
  const hash = await bcrypt.hash(password, 12);
  const phone = `+55119${String(Date.now()).slice(-7)}${Math.floor(Math.random() * 9)}`;
  const user = await prisma.user.create({
    data: {
      email,
      name: `Teste ${role}`,
      passwordHash: hash,
      role,
      accountStatus: AccountStatus.ACTIVE,
      phone,
    },
  });
  const login = await reqAs(jarName, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert(login.status === 200, `${role} login direct`);
  return user;
}

async function registerClient(jarName, email) {
  const password = "Ecopet@Forte2026";
  const suffix = String(Date.now()).slice(-8);
  const base = {
    role: "CLIENT",
    name: "Teste Cliente Silva",
    email,
    password,
    confirmPassword: password,
    phone: `+55119${suffix}`,
    birthDate: "1990-01-15",
    username: `user${suffix}`,
    gender: "MASCULINO",
    acceptTerms: true,
    acceptPrivacy: true,
  };
  const reg = await reqAs(jarName, "/api/auth/register", { method: "POST", body: JSON.stringify(base) });
  assert(reg.status === 201, `CLIENT register: ${reg.status} ${JSON.stringify(reg.data)}`);
  const login = await reqAs(jarName, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert(login.status === 200, "CLIENT login");
  return login.data.data?.user;
}

async function main() {
  const ts = Date.now();
  console.log("=== EcoPet Foundation Notifications Tests ===\n");

  const health = await reqAs("guest", "/api/health");
  assert(health.status === 200, "1 health ok");

  const client = await registerClient("client", `notify.client.${ts}@test.ecopet.local`);
  const partner = await createUserDirect("partner", UserRole.PARTNER, `notify.partner.${ts}@test.ecopet.local`);
  const ong = await createUserDirect("ong", UserRole.ONG, `notify.ong.${ts}@test.ecopet.local`);

  const guestList = await reqAs("guest", "/api/notifications");
  assert(guestList.status === 401, "2 visitante 401");

  const nClient = await prisma.notification.create({
    data: {
      userId: client.id,
      role: UserRole.CLIENT,
      type: "ORDER",
      title: "Pedido confirmado",
      message: "Seu pedido #123 foi confirmado.",
      actionUrl: "/pedidos",
      priority: "NORMAL",
    },
  });
  const nPartner = await prisma.notification.create({
    data: {
      userId: partner.id,
      role: UserRole.PARTNER,
      type: "ORDER",
      title: "Novo pedido",
      message: "Você recebeu um novo pedido.",
      priority: "HIGH",
    },
  });
  const nOng = await prisma.notification.create({
    data: {
      userId: ong.id,
      role: UserRole.ONG,
      type: "ADOPTION",
      title: "Solicitação de adoção",
      message: "Nova solicitação para Luna.",
      priority: "URGENT",
    },
  });

  const clientList = await reqAs("client", "/api/notifications");
  assert(clientList.status === 200, "3 cliente lista");
  assert(clientList.data.data?.notifications?.some((n) => n.id === nClient.id), "4 cliente vê sua notificação");

  const partnerList = await reqAs("partner", "/api/notifications");
  assert(partnerList.status === 200, "5 parceiro lista");
  assert(partnerList.data.data?.notifications?.some((n) => n.id === nPartner.id), "6 parceiro vê sua");

  const ongList = await reqAs("ong", "/api/notifications");
  assert(ongList.status === 200, "7 ONG lista");
  assert(ongList.data.data?.notifications?.some((n) => n.id === nOng.id), "8 ONG vê sua");

  assert(!clientList.data.data?.notifications?.some((n) => n.id === nPartner.id), "9 cliente não vê parceiro");
  assert(!partnerList.data.data?.notifications?.some((n) => n.id === nClient.id), "10 parceiro não vê cliente");

  const unreadBefore = await reqAs("client", "/api/notifications/unread-count");
  assert(unreadBefore.status === 200 && unreadBefore.data.data?.count >= 1, "11 unread count");

  const markRead = await reqAs("client", `/api/notifications/${nClient.id}/read`, { method: "PATCH", body: "{}" });
  assert(markRead.status === 200 && markRead.data.data?.notification?.read === true, "12 mark read");

  const unreadAfter = await reqAs("client", "/api/notifications/unread-count");
  assert(unreadAfter.data.data?.count < unreadBefore.data.data?.count, "13 unread diminui");

  await prisma.notification.create({
    data: { userId: client.id, type: "SOCIAL", title: "Curtida", message: "Alguém curtiu." },
  });
  const markAll = await reqAs("client", "/api/notifications/read-all", { method: "PATCH", body: "{}" });
  assert(markAll.status === 200, "14 mark all");
  const unreadZero = await reqAs("client", "/api/notifications/unread-count");
  assert(unreadZero.data.data?.count === 0, "15 todas lidas");

  const del = await reqAs("client", `/api/notifications/${nClient.id}`, { method: "DELETE" });
  assert(del.status === 200, "16 soft delete");
  const afterDel = await reqAs("client", "/api/notifications");
  assert(!afterDel.data.data?.notifications?.some((n) => n.id === nClient.id), "17 não lista deletada");

  const prefsGet = await reqAs("client", "/api/notifications/preferences");
  assert(prefsGet.status === 200, "18 prefs get");
  assert(prefsGet.data.data?.preferences?.inAppEnabled === true, "19 inApp default true");

  const prefsPut = await reqAs("client", "/api/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify({ socialUpdates: false, emailEnabled: true }),
  });
  assert(prefsPut.status === 200, "20 prefs put");
  assert(prefsPut.data.data?.preferences?.socialUpdates === false, "21 social off");

  const prefsSecurity = await reqAs("client", "/api/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify({ securityUpdates: false }),
  });
  assert(prefsSecurity.data.data?.preferences?.securityUpdates === true, "22 security forced on");

  const ptBR = JSON.parse(readFileSync(path.join(__dirname, "../apps/web/src/i18n/locales/pt-BR.json"), "utf8"));
  const en = JSON.parse(readFileSync(path.join(__dirname, "../apps/web/src/i18n/locales/en.json"), "utf8"));
  const es = JSON.parse(readFileSync(path.join(__dirname, "../apps/web/src/i18n/locales/es.json"), "utf8"));
  assert(ptBR.notifications?.title, "23 pt i18n");
  assert(en.notifications?.title, "24 en i18n");
  assert(es.notifications?.title, "25 es i18n");

  await prisma.notification.create({
    data: { userId: partner.id, type: "SERVICE", title: "Agendamento", message: "Novo agendamento." },
  });
  const unreadOnly = await reqAs("partner", "/api/notifications?read=unread");
  assert(unreadOnly.status === 200, "26 filtro unread");
  assert(unreadOnly.data.data?.notifications?.length >= 1, "27 unread filter");

  console.log("\n✅ Todos os 27 cenários foundation notifications passaram");
}

main()
  .catch((e) => {
    console.error("\n❌", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
