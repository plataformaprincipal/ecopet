/**
 * Testes Etapa — Produtos do parceiro (acesso imediato, sem aprovação admin)
 */
import { PrismaClient } from "@prisma/client";

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

async function registerPartner(email, suffix) {
  jar.clear();
  const reg = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "PARTNER", name: "Loja", email, password: pwd, confirmPassword: pwd,
      phone: phone(suffix), businessName: "Loja", legalName: "Loja LTDA", cnpj: cnpj(),
      category: "Pet Shop", address: "Rua A", city: "SP", state: "SP",
    }),
  });
  assert(reg.status === 201, "register partner");
  assert(reg.data.data?.user?.accountStatus === "ACTIVE", "partner ACTIVE sem aprovação");
}

async function main() {
  const ts = Date.now();
  const partnerEmail = `partner.prod.${ts}@test.ecopet.local`;
  const clientEmail = `client.prod.${ts}@test.ecopet.local`;

  await registerPartner(partnerEmail, ts);

  const create = await req("/api/partner/products", {
    method: "POST",
    body: JSON.stringify({
      name: "Ração Ativa", description: "Produto real completo", shortDescription: "Ração premium",
      catalogCategory: "FOOD", brand: "EcoMarca", price: 45, comparePrice: 40, stock: 5, status: "ACTIVE",
      sku: `SKU-${ts}`, unit: "kg", speciesTarget: "DOG",
    }),
  });
  if (!create.data?.data?.product) {
    throw new Error(`criar produto — status ${create.status} body ${JSON.stringify(create.data)}`);
  }
  assert(create.status === 201, "parceiro cria produto");
  assert(create.data.data.product.approvalStatus === "APPROVED", "produto APPROVED na criação");
  const productId = create.data.data.product.id;

  const list = await req("/api/partner/products");
  assert(list.data.data.products.some((p) => p.id === productId), "parceiro lista próprio produto");

  const pubList = await req("/api/public/products");
  assert(pubList.data.data.products.some((p) => p.id === productId), "produto aparece em /api/public/products");

  const pubActive = await req(`/api/public/products/${productId}`);
  assert(pubActive.status === 200, "cliente vê detalhe público");

  jar.clear();
  await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT", name: "Cliente Teste", email: clientEmail, password: pwd, confirmPassword: pwd,
      phone: phone(ts + 3), birthDate: "1990-01-01", username: `prd${ts}`, gender: "MASCULINO", acceptTerms: true, acceptPrivacy: true,
    }),
  });
  const cartAdd = await req("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  assert(cartAdd.status === 200 || cartAdd.status === 201, "cliente adiciona ao carrinho");

  const clientCreate = await req("/api/partner/products", {
    method: "POST",
    body: JSON.stringify({ name: "X", description: "Y", catalogCategory: "FOOD", price: 1, stock: 1 }),
  });
  assert(clientCreate.status === 403, "cliente não cria produto");

  const otherPartner = `other.prod.${ts}@test.ecopet.local`;
  await registerPartner(otherPartner, ts + 9);
  const foreignEdit = await req(`/api/partner/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify({ name: "Hack" }),
  });
  assert(foreignEdit.status === 404, "parceiro não edita produto de outro");

  jar.clear();
  await req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: partnerEmail, password: pwd }) });
  const edited = await req(`/api/partner/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify({ name: "Ração Editada", approvalStatus: "PENDING" }),
  });
  assert(edited.status === 200, "parceiro edita próprio produto");
  assert(edited.data.data.product.approvalStatus === "APPROVED", "edição mantém APPROVED");

  const deactivated = await req(`/api/partner/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify({ status: "INACTIVE" }),
  });
  assert(deactivated.status === 200, "parceiro desativa produto");
  const pubInactive = await req(`/api/public/products/${productId}`);
  assert(pubInactive.status === 404, "produto inativo não aparece publicamente");

  const draft = await req("/api/partner/products", {
    method: "POST",
    body: JSON.stringify({ name: "Draft", description: "Rascunho", catalogCategory: "FOOD", price: 1, stock: 1, status: "DRAFT" }),
  });
  const draftId = draft.data.data.product.id;
  const pubDraft = await req(`/api/public/products/${draftId}`);
  assert(pubDraft.status === 404, "rascunho não é público");

  console.log("✓ test:foundation:products passou");
}

main().catch((e) => { console.error("✗", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
