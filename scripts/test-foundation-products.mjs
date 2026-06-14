/**
 * Testes Etapa 8 — Produtos do parceiro
 */
import { PrismaClient, AccountStatus } from "@prisma/client";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const jar = new Map();
const pwd = "Ecopet@Forte2026";

function assert(c, m) { if (!c) throw new Error(m); }
function cnpj() { return String(Date.now()).slice(-10).padEnd(14, "0").slice(0, 14); }
function phone(s) { return `119${String(s).padStart(8, "0").slice(-8)}`; }

async function req(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (jar.get("c")) headers.Cookie = jar.get("c");
  const res = await fetch(`${WEB}${path}`, { ...opts, headers });
  const sc = res.headers.get("set-cookie");
  if (sc?.includes("ecopet-session")) jar.set("c", sc.split(";")[0]);
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function registerPartner(email, active, suffix) {
  jar.clear();
  await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "PARTNER", name: "Loja", email, password: pwd, confirmPassword: pwd,
      phone: phone(suffix), businessName: "Loja", legalName: "Loja LTDA", cnpj: cnpj(),
      category: "Pet Shop", address: "Rua A", city: "SP", state: "SP",
    }),
  });
  if (active) await prisma.user.update({ where: { email }, data: { accountStatus: AccountStatus.ACTIVE } });
}

async function main() {
  const ts = Date.now();
  const pending = `partner.prod.pend.${ts}@test.ecopet.local`;
  const active = `partner.prod.act.${ts}@test.ecopet.local`;

  await registerPartner(pending, false, ts + 1);
  const pendCreate = await req("/api/partner/products", {
    method: "POST",
    body: JSON.stringify({ name: "Ração", description: "Ração premium", catalogCategory: "FOOD", price: 50, stock: 10 }),
  });
  assert(pendCreate.status === 403, "pending blocked");

  await registerPartner(active, true, ts + 2);
  await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: active, password: pwd }) });

  const create = await req("/api/partner/products", {
    method: "POST",
    body: JSON.stringify({
      name: "Ração Ativa", description: "Produto real", catalogCategory: "FOOD", price: 45, stock: 5, status: "ACTIVE",
    }),
  });
  if (!create.data?.data?.product) {
    throw new Error(`active creates product — status ${create.status} body ${JSON.stringify(create.data)}`);
  }
  assert(create.status === 201, "active creates product");
  const productId = create.data.data.product.id;

  await prisma.product.update({
    where: { id: productId },
    data: { approvalStatus: "APPROVED" },
  });

  const list = await req("/api/partner/products");
  assert(list.data.data.products.some((p) => p.id === productId), "partner lists own");

  const draft = await req("/api/partner/products", {
    method: "POST",
    body: JSON.stringify({ name: "Draft", description: "Rascunho", catalogCategory: "FOOD", price: 1, stock: 1, status: "DRAFT" }),
  });
  const draftId = draft.data.data.product.id;
  const pubDraft = await req(`/api/public/products/${draftId}`);
  assert(pubDraft.status === 404, "draft not public");

  const pubActive = await req(`/api/public/products/${productId}`);
  assert(pubActive.status === 200, "active public");

  const zeroStock = await req("/api/partner/products", {
    method: "POST",
    body: JSON.stringify({ name: "Zero", description: "Sem estoque", catalogCategory: "FOOD", price: 1, stock: 0, status: "ACTIVE" }),
  });
  const zeroId = zeroStock.data.data.product.id;
  await prisma.product.update({ where: { id: zeroId }, data: { approvalStatus: "APPROVED" } });
  const pubZero = await req(`/api/public/products/${zeroId}`);
  assert(pubZero.status === 404 || pubZero.data?.data?.product?.stock === 0, "zero stock hidden or empty");

  console.log("✓ test:foundation:products passou");
}

main().catch((e) => { console.error("✗", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
