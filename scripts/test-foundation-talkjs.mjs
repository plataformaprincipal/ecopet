/**
 * Testes TalkJS — integração de mensagens EcoPet.
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
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function login(email, password) {
  const res = await reqAs(email, "/api/auth/callback/credentials", {
    method: "POST",
    body: JSON.stringify({ email, password, redirect: false, json: true }),
  });
  return res.status === 200 || res.data?.ok;
}

async function ensureUser({ email, password, role, name }) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const hash = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: {
        email,
        password: hash,
        name,
        role,
        accountStatus: AccountStatus.ACTIVE,
        emailVerified: new Date(),
      },
    });
  }
  await login(email, password);
  return user;
}

const tests = [
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
      const client = await ensureUser({
        email: `talkjs-client-${Date.now()}@test.local`,
        password: "Test@123456",
        role: UserRole.CLIENT,
        name: "Cliente TalkJS",
      });
      const partner = await ensureUser({
        email: `talkjs-partner-${Date.now()}@test.local`,
        password: "Test@123456",
        role: UserRole.PARTNER,
        name: "Parceiro TalkJS",
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
      assert(res.data.data.conversationId, "missing conversationId");
      assert(res.data.data.talkjsConversationId, "missing talkjsConversationId");
    },
  },
  {
    name: "cliente inicia conversa com ONG",
    async run() {
      const client = await ensureUser({
        email: `talkjs-client-ong-${Date.now()}@test.local`,
        password: "Test@123456",
        role: UserRole.CLIENT,
        name: "Cliente ONG",
      });
      const ong = await ensureUser({
        email: `talkjs-ong-${Date.now()}@test.local`,
        password: "Test@123456",
        role: UserRole.ONG,
        name: "ONG TalkJS",
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
      assert(res.data.data.talkjsConversationId.includes("ADOPTION"), "context in id");
    },
  },
  {
    name: "conversa não duplica para mesmo contexto",
    async run() {
      const client = await ensureUser({
        email: `talkjs-dedupe-c-${Date.now()}@test.local`,
        password: "Test@123456",
        role: UserRole.CLIENT,
        name: "Cliente Dedupe",
      });
      const partner = await ensureUser({
        email: `talkjs-dedupe-p-${Date.now()}@test.local`,
        password: "Test@123456",
        role: UserRole.PARTNER,
        name: "Parceiro Dedupe",
      });

      const body = {
        participantUserId: partner.id,
        contextType: "PRODUCT",
        contextId: "prod-dedupe-1",
      };
      const first = await reqAs(client.email, "/api/messages/conversations", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const second = await reqAs(client.email, "/api/messages/conversations", {
        method: "POST",
        body: JSON.stringify(body),
      });
      assert(first.data.data.conversationId === second.data.data.conversationId, "duplicate conversation");
      assert(second.data.data.created === false, "second should not create");
    },
  },
  {
    name: "usuário não acessa conversa de terceiros",
    async run() {
      const clientA = await ensureUser({
        email: `talkjs-a-${Date.now()}@test.local`,
        password: "Test@123456",
        role: UserRole.CLIENT,
        name: "Cliente A",
      });
      const clientB = await ensureUser({
        email: `talkjs-b-${Date.now()}@test.local`,
        password: "Test@123456",
        role: UserRole.CLIENT,
        name: "Cliente B",
      });
      const partner = await ensureUser({
        email: `talkjs-p-iso-${Date.now()}@test.local`,
        password: "Test@123456",
        role: UserRole.PARTNER,
        name: "Parceiro ISO",
      });

      const created = await reqAs(clientA.email, "/api/messages/conversations", {
        method: "POST",
        body: JSON.stringify({ participantUserId: partner.id, contextType: "GENERAL" }),
      });
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
    name: "/mensagens responde (redirect ou 200)",
    async run() {
      const res = await fetch(`${WEB}/mensagens`, { redirect: "manual" });
      assert(res.status === 200 || res.status === 307 || res.status === 308, `status ${res.status}`);
    },
  },
];

async function main() {
  let passed = 0;
  let failed = 0;
  for (const t of tests) {
    try {
      await t.run();
      console.log(`✓ ${t.name}`);
      passed++;
    } catch (e) {
      console.error(`✗ ${t.name}: ${e.message}`);
      failed++;
    }
  }
  await prisma.$disconnect();
  console.log(`\nTalkJS: ${passed}/${tests.length} passed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
