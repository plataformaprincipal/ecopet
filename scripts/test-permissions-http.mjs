/**
 * Testes HTTP de permissões — requer WEB_URL (ex.: http://localhost:3000)
 */
const BASE = process.env.WEB_URL || "http://localhost:3000";

function mergeCookies(current, response) {
  const jar = new Map();
  for (const part of current.split(";").map((s) => s.trim()).filter(Boolean)) {
    const [k, ...v] = part.split("=");
    if (k) jar.set(k, v.join("="));
  }
  const setCookies = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie")].filter(Boolean);
  for (const raw of setCookies) {
    const first = String(raw).split(";")[0];
    const eq = first.indexOf("=");
    if (eq > 0) jar.set(first.slice(0, eq), first.slice(eq + 1));
  }
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function req(path, opts = {}, cookie = "") {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    redirect: opts.redirect ?? "manual",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { _raw: text.slice(0, 200) };
  }
  return {
    status: res.status,
    data,
    cookie: mergeCookies(cookie, res),
    location: res.headers.get("location"),
  };
}

function genCnpj() {
  const rnd = () => Math.floor(Math.random() * 9);
  const digits = Array.from({ length: 12 }, rnd);
  const calc = (base) => {
    let sum = 0;
    let pos = base - 7;
    for (let i = base; i >= 1; i--) {
      sum += digits[base - i] * pos--;
      if (pos < 2) pos = 9;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  digits.push(calc(12));
  digits.push(calc(13));
  return digits.join("");
}

function isRedirectToDashboard(location) {
  return location?.includes("/dashboard") || location?.includes("/gestor");
}

export async function runHttpPermissionTests() {
  const ts = Date.now();
  const password = "SenhaForte@123";
  let passed = 0;
  let failed = 0;

  function ok(label, cond, detail) {
    if (cond) {
      console.log(`✓ [HTTP] ${label}`);
      passed++;
    } else {
      console.error(`✗ [HTTP] ${label}${detail ? ` — ${detail}` : ""}`);
      failed++;
    }
  }

  async function registerOrFail(body, label) {
    const r = await req("/api/auth/register", { method: "POST", body: JSON.stringify(body) });
    if (r.status !== 201) {
      ok(`${label} cadastro 201`, false, `status ${r.status} ${JSON.stringify(r.data?.error ?? r.data)}`);
      return false;
    }
    return true;
  }

  async function loginOrFail(email, label) {
    const r = await req("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (r.status !== 200) {
      ok(`${label} login 200`, false, `status ${r.status}`);
      return null;
    }
    return r.cookie;
  }

  console.log("\n--- Testes HTTP de permissão ---\n");

  try {
    await fetch(`${BASE}/login`);
  } catch {
    console.log("⚠ Servidor indisponível — testes HTTP ignorados (defina WEB_URL ou inicie npm run dev)\n");
    return { passed: 0, failed: 0, skipped: true };
  }

  const guestDash = await req("/dashboard");
  ok("visitante GET /dashboard → redirect /login", (guestDash.status === 302 || guestDash.status === 307) && guestDash.location?.includes("/login"));

  const guestGestor = await req("/gestor");
  ok("visitante GET /gestor → redirect /login", (guestGestor.status === 302 || guestGestor.status === 307) && guestGestor.location?.includes("/login"));

  const clientEmail = `perm.client.${ts}@ecopet.com`;
  const partnerEmail = `perm.partner.${ts}@ecopet.com`;
  const ongEmail = `perm.ong.${ts}@ecopet.com`;
  const adminEmail = `perm.admin.${ts}@ecopet.com`;
  const partnerCnpj = genCnpj();
  const ongCnpj = genCnpj();

  await registerOrFail({
    role: "CLIENT",
    name: "Perm Client",
    email: clientEmail,
    password,
    confirmPassword: password,
    phone: `11911${String(ts).slice(-6)}`,
    birthDate: "1990-05-15",
    username: `perm${String(ts).slice(-8)}`,
    gender: "MASCULINO",
    acceptTerms: true,
    acceptPrivacy: true,
  }, "CLIENT");

  await registerOrFail({
    role: "PARTNER",
    name: "Perm Partner",
    email: partnerEmail,
    password,
    confirmPassword: password,
    phone: `11922${String(ts).slice(-6)}`,
    businessName: "Loja Perm",
    legalName: "Loja Perm LTDA",
    cnpj: partnerCnpj,
    category: "Petshop",
    commercialEmail: partnerEmail,
    responsibleName: "Resp Perm",
    address: "Rua A, 1",
    city: "Sao Paulo",
    state: "SP",
    zipCode: "01310100",
  }, "PARTNER");

  await registerOrFail({
    role: "ONG",
    name: "Perm ONG",
    email: ongEmail,
    password,
    confirmPassword: password,
    phone: `11933${String(ts).slice(-6)}`,
    ongName: "ONG Perm",
    cnpj: ongCnpj,
    responsibleName: "Resp ONG",
    address: "Rua B, 2",
    city: "Recife",
    state: "PE",
    zipCode: "50010000",
  }, "ONG");

  const bcrypt = await import("bcryptjs");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: { name: "Perm Admin", email: adminEmail, passwordHash, role: "ADMIN" },
    update: { role: "ADMIN", passwordHash },
  });
  await prisma.$disconnect();

  const clientCookie = await loginOrFail(clientEmail, "CLIENT");
  if (!clientCookie) {
    console.log(`\n[HTTP] ${passed} passaram, ${failed} falharam (abortado após login CLIENT)`);
    return { passed, failed, skipped: false };
  }

  const clientGestor = await req("/gestor", {}, clientCookie);
  ok("CLIENT GET /gestor → redirect dashboard", (clientGestor.status === 302 || clientGestor.status === 307) && isRedirectToDashboard(clientGestor.location));

  const clientAdmin = await req("/admin", {}, clientCookie);
  ok("CLIENT GET /admin → redirect dashboard", (clientAdmin.status === 302 || clientAdmin.status === 307) && isRedirectToDashboard(clientAdmin.location));

  const partnerCookie = await loginOrFail(partnerEmail, "PARTNER");
  if (partnerCookie) {
    const partnerMeuPet = await req("/meu-pet", {}, partnerCookie);
    ok("PARTNER GET /meu-pet → redirect dashboard", (partnerMeuPet.status === 302 || partnerMeuPet.status === 307) && partnerMeuPet.location?.includes("/dashboard"));
  }

  const ongCookie = await loginOrFail(ongEmail, "ONG");
  if (ongCookie) {
    const ongMarketPrivate = await req("/marketplace/carrinho", {}, ongCookie);
    ok("ONG GET marketplace interno → redirect dashboard", (ongMarketPrivate.status === 302 || ongMarketPrivate.status === 307) && ongMarketPrivate.location?.includes("/dashboard"));
  }

  const adminCookie = await loginOrFail(adminEmail, "ADMIN");
  if (adminCookie) {
    const adminGestor = await req("/gestor", { redirect: "manual" }, adminCookie);
    ok("ADMIN GET /gestor → 200", adminGestor.status === 200);

    const adminAdmin = await req("/admin", { redirect: "manual" }, adminCookie);
    ok("ADMIN GET /admin → redirect /gestor ou 200", adminAdmin.status === 200 || adminAdmin.location?.includes("/gestor"));
  }

  const clientProfile = await req("/api/profile/me", {}, clientCookie);
  ok(
    "CLIENT GET /api/profile/me → 200 próprio",
    clientProfile.status === 200 && clientProfile.data.profile?.role === "CLIENT",
    clientProfile.status !== 200 ? `status ${clientProfile.status}` : `role=${clientProfile.data.profile?.role}`
  );

  if (partnerCookie) {
    const partnerProfile = await req("/api/profile/me", {}, partnerCookie);
    ok(
      "PARTNER GET /api/profile/me → 200",
      partnerProfile.status === 200 && partnerProfile.data.profile?.role === "PARTNER",
      partnerProfile.status !== 200 ? `status ${partnerProfile.status}` : `role=${partnerProfile.data.profile?.role}`
    );
  }

  console.log(`\n[HTTP] ${passed} passaram, ${failed} falharam`);
  return { passed, failed, skipped: false };
}
