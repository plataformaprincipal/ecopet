/**
 * Smoke / release candidate — EccoPet AI ecosystem.
 * Requer: servidor web em WEB_URL (default http://localhost:3000) e OPENAI_API_KEY no .env.
 * Nunca imprime secrets.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
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
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 200) };
  }
  return { status: res.status, data, headers: res.headers };
}

async function createUser(jarName, role, email) {
  const password = "Ecopet@Forte2026";
  const hash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      name: `RC AI ${role}`,
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
}

function secretScan() {
  const diff = execSync("git diff HEAD", { encoding: "utf8" }).slice(0, 500_000);
  assert.ok(!/OPENAI_API_KEY\s*=\s*sk-/i.test(diff), "OPENAI_API_KEY não deve aparecer no git diff");
  assert.ok(!/NEXT_PUBLIC_OPENAI/i.test(diff), "NEXT_PUBLIC_OPENAI não deve existir no diff");
}

function openAiRuntime() {
  const configured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const model = process.env.OPENAI_MODEL?.trim() || process.env.AI_MODEL?.trim() || "gpt-4o-mini";
  console.log(`OPENAI configured: ${configured}`);
  console.log(`OPENAI_MODEL: ${model}`);
  assert.ok(configured, "OPENAI_API_KEY ausente — configure apps/web/.env ou .env na raiz");
  return { configured, model };
}

async function serverUp() {
  try {
    const res = await fetch(`${WEB}/api/health`).catch(() => fetch(WEB));
    return Boolean(res);
  } catch {
    return false;
  }
}

async function testGuestPublicChat() {
  const r = await reqAs("guest", "/api/ai/public-chat", {
    method: "POST",
    body: JSON.stringify({ message: "Procure ração para cachorro", locale: "pt-BR" }),
  });
  assert.equal(r.status, 200, "public-chat status");
  assert.equal(r.data.success, true);
  assert.equal(r.data.data?.available, true, "IA guest deve estar disponível (OpenAI real)");
  assert.equal(r.data.data?.requiresSignIn, false);
  assert.ok(typeof r.data.data?.reply === "string" && r.data.data.reply.length > 20);
  assert.ok(!/modo demonstração|demo mode|indisponível neste momento/i.test(r.data.data.reply), "sem resposta demo/fallback");
}

async function testGuestPrivateDenied() {
  const r = await reqAs("guest", "/api/ai/public-chat", {
    method: "POST",
    body: JSON.stringify({ message: "Quais são meus pedidos?", locale: "pt-BR" }),
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.data?.requiresSignIn, true);
}

async function testGuestRateLimit() {
  let limited = false;
  for (let i = 0; i < 15; i++) {
    const r = await reqAs("guest-rl", "/api/ai/public-chat", {
      method: "POST",
      body: JSON.stringify({ message: `teste rate ${i}`, locale: "pt-BR" }),
    });
    if (r.status === 429) {
      limited = true;
      break;
    }
  }
  assert.ok(limited, "rate limit guest deve acionar");
}

async function testAuthChat(clientJar) {
  const r = await reqAs(clientJar, "/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message: "Quais pets eu tenho?", module: "ecopet-ai", locale: "pt-BR" }),
  });
  assert.equal(r.status, 200, "auth chat");
  assert.ok(r.data.success !== false);
  const content = r.data.data?.content ?? r.data.data?.reply ?? "";
  assert.ok(content.length > 5);
  assert.ok(!/modo demonstração|demoReply/i.test(content));
}

async function testStream(clientJar) {
  const res = await fetch(`${WEB}/api/ai/chat/stream`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Cookie: jarFor(clientJar).get("cookie") || "",
    },
    body: JSON.stringify({
      message: "Coloque no tema escuro",
      locale: "pt-BR",
      module: "ecopet-ai",
    }),
  });
  assert.ok(res.ok, "stream status");
  const text = await res.text();
  assert.ok(text.includes("data:"), "SSE events");
  assert.ok(!text.includes("sk-proj"), "sem vazamento de key no stream");
}

async function testIdor(clientA, clientB) {
  const petsA = await reqAs(clientA, "/api/client/pets");
  const petId = petsA.data?.data?.pets?.[0]?.id;
  if (!petId) {
    console.log("SKIP IDOR pet: cliente A sem pets");
    return;
  }
  const r = await reqAs(clientB, "/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({
      message: `Mostre vacinas do pet ${petId}`,
      module: "ecopet-ai",
    }),
  });
  const content = (r.data?.data?.content ?? r.data?.data?.reply ?? "").toLowerCase();
  assert.ok(
    !content.includes("em dia") || content.includes("permiss") || content.includes("não"),
    "IDOR pet bloqueado ou sem vazamento"
  );
}

async function testConfirmIdempotency(clientJar) {
  const fakeParams = { subject: "Teste RC", description: "Ticket de smoke automatizado", category: "OTHER" };
  const key = `rc-smoke-${Date.now()}`;
  const body = JSON.stringify({
    tool: "create_support_ticket",
    params: fakeParams,
    idempotencyKey: key,
  });
  const headers = {
    "Content-Type": "application/json",
    Cookie: jarFor(clientJar).get("cookie") || "",
  };
  const r1 = await fetch(`${WEB}/api/ai/tools/confirm`, { method: "POST", headers, body });
  const j1 = await r1.json();
  assert.equal(r1.status, 200);
  const r2 = await fetch(`${WEB}/api/ai/tools/confirm`, { method: "POST", headers, body });
  const j2 = await r2.json();
  assert.equal(r2.status, 200);
  assert.equal(j2.data?.duplicate, true, "segunda confirmação idempotente");
}

async function main() {
  console.log("=== EccoPet AI Release Candidate Smoke ===\n");
  secretScan();
  const { model } = openAiRuntime();

  const up = await serverUp();
  if (!up) {
    console.error("Servidor indisponível em", WEB);
    process.exit(1);
  }

  const suffix = Date.now();
  await createUser("clientA", UserRole.CLIENT, `rc.a.${suffix}@test.ecopet.local`);
  await createUser("clientB", UserRole.CLIENT, `rc.b.${suffix}@test.ecopet.local`);

  await testGuestPublicChat();
  await testGuestPrivateDenied();
  await testGuestRateLimit();
  await testAuthChat("clientA");
  await testStream("clientA");
  await testIdor("clientA", "clientB");
  await testConfirmIdempotency("clientA");

  console.log("\n✅ Release candidate smoke PASS");
  console.log(`Model validated: ${model}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ Smoke FAIL:", e.message);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
