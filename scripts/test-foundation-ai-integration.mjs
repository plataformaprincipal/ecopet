/**
 * Testes de integração foundation AI — requer servidor web opcional.
 * Sem chave OpenAI, valida 401/503 e isolamento; com chave, valida chat.
 */
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, AccountStatus } from "@prisma/client";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();
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
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function createUser(jarName, role, email) {
  const password = "Ecopet@Forte2026";
  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name: `AI Test ${role}`,
      passwordHash: hash,
      role,
      accountStatus: AccountStatus.ACTIVE,
      phone: `+55119${String(Date.now()).slice(-8)}`,
    },
  });
  const login = await reqAs(jarName, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert.equal(login.status, 200, `login ${role}`);
  return user;
}

async function serverUp() {
  try {
    const res = await fetch(`${WEB}/api/health`).catch(() => fetch(WEB));
    return Boolean(res);
  } catch {
    return false;
  }
}

async function main() {
  const up = await serverUp();
  if (!up) {
    console.log("SKIP integration: web server not reachable at", WEB);
    console.log("Unit/policy checks covered by test-foundation-ai unit suite.");
    process.exit(0);
  }

  const suffix = Date.now();
  const a = await createUser("a", UserRole.CLIENT, `ai.a.${suffix}@test.ecopet.local`);
  const b = await createUser("b", UserRole.CLIENT, `ai.b.${suffix}@test.ecopet.local`);

  // Sem sessão
  const anon = await fetch(`${WEB}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "olá" }),
  });
  assert.ok([401, 403].includes(anon.status), `anon should be unauthorized, got ${anon.status}`);

  // Chat autenticado — 200 com chave ou 503 sem chave / limite
  const chat = await reqAs("a", "/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message: "Olá EcoPet AI, o que você pode fazer?" }),
  });
  assert.ok([200, 429, 503].includes(chat.status), `chat status ${chat.status}`);
  if (chat.status === 200) {
    const content = chat.data?.data?.content ?? chat.data?.data?.reply;
    assert.ok(content && content.length > 0, "content present");
    assert.ok(!/sk-[a-zA-Z0-9]/.test(JSON.stringify(chat.data)), "no api key leaked");
  }

  // Isolamento: B não lê conversa de A
  const listA = await reqAs("a", "/api/ai/conversations");
  if (listA.status === 200) {
    const convs = listA.data?.data?.conversations ?? [];
    if (convs[0]) {
      const steal = await reqAs("b", `/api/ai/conversations/${convs[0].id}`);
      assert.ok([403, 404].includes(steal.status), "isolation between users");
    }
  }

  // Soft delete
  if (listA.status === 200 && listA.data?.data?.conversations?.[0]) {
    const id = listA.data.data.conversations[0].id;
    const del = await reqAs("a", `/api/ai/conversations/${id}`, { method: "DELETE" });
    assert.equal(del.status, 200);
  }

  // Privacy endpoints
  const priv = await reqAs("a", "/api/ai/privacy");
  assert.equal(priv.status, 200);

  // Partner product description requires partner — client should 403 on persona if module partner-only
  // products module is allowed for client in policy for compare; partner description uses products module
  const tags = await reqAs("a", "/api/ai/partner/product-tags", {
    method: "POST",
    body: JSON.stringify({ input: "Ração premium para cães adultos" }),
  });
  assert.ok([200, 403, 429, 503].includes(tags.status), `product-tags ${tags.status}`);

  console.log("OK foundation AI integration", {
    userA: a.id,
    userB: b.id,
    chat: chat.status,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
