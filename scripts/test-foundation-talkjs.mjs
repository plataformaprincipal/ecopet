/**
 * Testes TalkJS — integração de mensagens EcoPet.
 * Fixtures alinhadas ao schema (passwordHash) e sessão cookie JWT.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, AccountStatus } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.join(root, ".env"));
loadEnvFile(path.join(root, "apps", "web", ".env"));

const WEB = process.env.WEB_URL || "http://localhost:3000";
const PASSWORD = "Ecopet@Forte2026";
const prisma = new PrismaClient({
  datasources: process.env.DATABASE_URL
    ? { db: { url: process.env.DATABASE_URL } }
    : undefined,
});

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const jars = new Map();

function jarFor(name) {
  if (!jars.has(name)) jars.set(name, new Map());
  return jars.get(name);
}

async function reqAs(jarName, pathName, opts = {}) {
  const jar = jarFor(jarName);
  const headers = {
    "Content-Type": "application/json",
    "x-forwarded-for": opts.testIp ?? `198.51.100.${(jarName.length % 200) + 1}`,
    ...(opts.headers || {}),
  };
  const cookie = jar.get("cookie");
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(`${WEB}${pathName}`, { ...opts, headers });

  const setCookie = res.headers.get("set-cookie");
  const setCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : setCookie
        ? [setCookie]
        : [];
  for (const raw of setCookies) {
    const session = raw.split(";")[0];
    if (session.includes("ecopet-session=")) jar.set("cookie", session);
    if (raw.includes("Max-Age=0") || raw.includes("max-age=0")) jar.delete("cookie");
  }

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function login(jarName, email) {
  const res = await reqAs(jarName, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  assert(res.status === 200, `login ${email} → ${res.status} ${JSON.stringify(res.data?.error ?? {})}`);
  return res;
}

async function ensureUser({ email, role, name, phoneSuffix }) {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const phone = `+55119${String(phoneSuffix).replace(/\D/g, "").padStart(8, "0").slice(-8)}`;

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash: hash,
      name,
      role,
      accountStatus: AccountStatus.ACTIVE,
      phone,
      termsAcceptedAt: new Date(),
      lgpdAcceptedAt: new Date(),
    },
    update: {
      passwordHash: hash,
      name,
      role,
      accountStatus: AccountStatus.ACTIVE,
      phone,
    },
  });

  await login(email, email);
  return user;
}

function assertTalkJsEnvConfigured() {
  const appId = process.env.NEXT_PUBLIC_TALKJS_APP_ID?.trim();
  const secret = process.env.TALKJS_SECRET_KEY?.trim();
  assert(appId, "NEXT_PUBLIC_TALKJS_APP_ID ausente no ambiente de teste");
  assert(secret, "TALKJS_SECRET_KEY ausente no ambiente de teste");
  assert(appId.length >= 6, "NEXT_PUBLIC_TALKJS_APP_ID parece inválido");
  assert(secret.startsWith("sk_"), "TALKJS_SECRET_KEY deve começar com sk_");
}

const tests = [
  {
    name: "env TalkJS configurado (APP_ID + SECRET)",
    async run() {
      assertTalkJsEnvConfigured();
    },
  },
  {
    name: "visitante não acessa POST /api/messages/conversations",
    async run() {
      const res = await reqAs("guest", "/api/messages/conversations", {
        method: "POST",
        body: JSON.stringify({ participantUserId: "x" }),
      });
      assert(res.status === 401, `expected 401 got ${res.status}`);
    },
  },
  {
    name: "cliente inicia conversa com parceiro (TalkJS)",
    async run() {
      const ts = Date.now();
      const client = await ensureUser({
        email: `talkjs-client-${ts}@test.ecopet.local`,
        role: UserRole.CLIENT,
        name: "Cliente TalkJS",
        phoneSuffix: `${ts}01`,
      });
      const partner = await ensureUser({
        email: `talkjs-partner-${ts}@test.ecopet.local`,
        role: UserRole.PARTNER,
        name: "Parceiro TalkJS",
        phoneSuffix: `${ts}02`,
      });

      const res = await reqAs(client.email, "/api/messages/conversations", {
        method: "POST",
        body: JSON.stringify({
          participantUserId: partner.id,
          contextType: "GENERAL",
        }),
      });
      assert(res.status === 200 || res.status === 201, JSON.stringify(res.data));
      assert(res.data.success, JSON.stringify(res.data));
      assert(res.data.data?.conversationId, "missing conversationId");
      assert(res.data.data?.talkjsConversationId, "missing talkjsConversationId");
      assert(
        String(res.data.data.talkjsConversationId).startsWith("ecopet_GENERAL_"),
        `talkjs id inválido: ${res.data.data.talkjsConversationId}`
      );

      const detail = await reqAs(
        client.email,
        `/api/messages/conversations/${res.data.data.conversationId}`
      );
      assert(detail.status === 200, `recuperar conversa ${detail.status}`);
      assert(detail.data?.data?.conversation?.id === res.data.data.conversationId, "id conversa");
    },
  },
  {
    name: "cliente inicia conversa com ONG",
    async run() {
      const ts = Date.now();
      const client = await ensureUser({
        email: `talkjs-client-ong-${ts}@test.ecopet.local`,
        role: UserRole.CLIENT,
        name: "Cliente ONG",
        phoneSuffix: `${ts}03`,
      });
      const ong = await ensureUser({
        email: `talkjs-ong-${ts}@test.ecopet.local`,
        role: UserRole.ONG,
        name: "ONG TalkJS",
        phoneSuffix: `${ts}04`,
      });

      const res = await reqAs(client.email, "/api/messages/conversations", {
        method: "POST",
        body: JSON.stringify({
          participantUserId: ong.id,
          contextType: "ADOPTION",
          contextId: "post-test-1",
        }),
      });
      assert(res.status === 200 || res.status === 201, JSON.stringify(res.data));
      assert(res.data.success, JSON.stringify(res.data));
      assert(
        String(res.data.data?.talkjsConversationId ?? "").includes("ADOPTION"),
        `context in id: ${res.data.data?.talkjsConversationId}`
      );
    },
  },
  {
    name: "conversa não duplica para mesmo contexto",
    async run() {
      const ts = Date.now();
      const client = await ensureUser({
        email: `talkjs-dedupe-c-${ts}@test.ecopet.local`,
        role: UserRole.CLIENT,
        name: "Cliente Dedupe",
        phoneSuffix: `${ts}05`,
      });
      const partner = await ensureUser({
        email: `talkjs-dedupe-p-${ts}@test.ecopet.local`,
        role: UserRole.PARTNER,
        name: "Parceiro Dedupe",
        phoneSuffix: `${ts}06`,
      });

      const body = {
        participantUserId: partner.id,
        contextType: "PRODUCT",
        contextId: `prod-dedupe-${ts}`,
      };
      const first = await reqAs(client.email, "/api/messages/conversations", {
        method: "POST",
        body: JSON.stringify(body),
      });
      assert(first.status === 200 || first.status === 201, JSON.stringify(first.data));
      const second = await reqAs(client.email, "/api/messages/conversations", {
        method: "POST",
        body: JSON.stringify(body),
      });
      assert(second.status === 200 || second.status === 201, JSON.stringify(second.data));
      assert(
        first.data.data.conversationId === second.data.data.conversationId,
        "duplicate conversation"
      );
      assert(second.data.data.created === false, "second should not create");
    },
  },
  {
    name: "usuário não acessa conversa de terceiros",
    async run() {
      const ts = Date.now();
      const clientA = await ensureUser({
        email: `talkjs-a-${ts}@test.ecopet.local`,
        role: UserRole.CLIENT,
        name: "Cliente A",
        phoneSuffix: `${ts}07`,
      });
      const clientB = await ensureUser({
        email: `talkjs-b-${ts}@test.ecopet.local`,
        role: UserRole.CLIENT,
        name: "Cliente B",
        phoneSuffix: `${ts}08`,
      });
      const partner = await ensureUser({
        email: `talkjs-p-iso-${ts}@test.ecopet.local`,
        role: UserRole.PARTNER,
        name: "Parceiro ISO",
        phoneSuffix: `${ts}09`,
      });

      const created = await reqAs(clientA.email, "/api/messages/conversations", {
        method: "POST",
        body: JSON.stringify({ participantUserId: partner.id, contextType: "GENERAL" }),
      });
      assert(created.status === 200 || created.status === 201, JSON.stringify(created.data));
      const convId = created.data.data.conversationId;
      const forbidden = await reqAs(clientB.email, `/api/messages/conversations/${convId}`);
      assert(forbidden.status === 403, `expected 403 got ${forbidden.status}`);
    },
  },
  {
    name: "GET /api/messages/talkjs/session requer auth",
    async run() {
      const res = await reqAs("guest2", "/api/messages/talkjs/session");
      assert(res.status === 401, `expected 401 got ${res.status}`);
    },
  },
  {
    name: "GET /api/messages/talkjs/session retorna appId autenticado",
    async run() {
      const ts = Date.now();
      const client = await ensureUser({
        email: `talkjs-session-${ts}@test.ecopet.local`,
        role: UserRole.CLIENT,
        name: "Cliente Session",
        phoneSuffix: `${ts}10`,
      });
      const res = await reqAs(client.email, "/api/messages/talkjs/session");
      assert(res.status === 200, `session ${res.status} ${JSON.stringify(res.data)}`);
      assert(res.data?.data?.appId, "appId ausente");
      assert(
        res.data.data.appId === process.env.NEXT_PUBLIC_TALKJS_APP_ID?.trim(),
        "appId divergente do NEXT_PUBLIC_TALKJS_APP_ID"
      );
      assert(res.data.data.userId === client.id, "userId da sessão");
      assert(typeof res.data.data.signature === "string" && res.data.data.signature.length > 10, "signature");
      assert(res.data.data.identityVerificationEnabled === true, "identity verification");
    },
  },
  {
    name: "/mensagens responde (redirect ou 200)",
    async run() {
      const res = await fetch(`${WEB}/mensagens`, { redirect: "manual" });
      assert(
        res.status === 200 || res.status === 307 || res.status === 308 || res.status === 302,
        `status ${res.status}`
      );
    },
  },
];

async function main() {
  console.log("=== EcoPet Foundation TalkJS Tests ===\n");
  console.log(`WEB_URL=${WEB}`);

  let passed = 0;
  let failed = 0;
  for (const t of tests) {
    try {
      await t.run();
      console.log(`✓ ${t.name}`);
      passed += 1;
    } catch (e) {
      console.error(`✗ ${t.name}: ${e.message}`);
      failed += 1;
    }
  }

  console.log(`\nTalkJS: ${passed}/${tests.length} passed`);
  process.exitCode = failed > 0 ? 1 : 0;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch {
      /* ignore */
    }
  });
