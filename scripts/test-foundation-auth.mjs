/**
 * Testes de fundação: cadastro, login, sessão, proteção por role.
 * Usa e-mails únicos por execução — não é seed permanente.
 */
const WEB = process.env.WEB_URL || "http://localhost:3000";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function generateCnpj() {
  const base = String(Date.now()).slice(-8).padStart(8, "0") + "0001";
  return base.padEnd(14, "0").slice(0, 14);
}

const cookieJar = new Map();

async function req(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const cookie = cookieJar.get("cookie");
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(`${WEB}${path}`, {
    ...opts,
    headers,
  });

  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const session = setCookie.split(";")[0];
    if (session.includes("=")) cookieJar.set("cookie", session);
    if (setCookie.includes("Max-Age=0") || setCookie.includes("max-age=0")) {
      cookieJar.delete("cookie");
    }
  }

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, headers: res.headers };
}

async function main() {
  const ts = Date.now();
  const password = "Ecopet@Forte2026";

  console.log("=== EcoPet Foundation Auth Tests ===\n");

  // 1. Health
  const health = await req("/api/health");
  console.log("[health]", health.status, health.data);
  assert(health.status === 200, "health deve retornar 200");
  assert(health.data.success === true, "health success");
  assert(health.data.data?.database === "connected", "database connected");

  // 2. Register CLIENT
  const clientEmail = `client.${ts}@test.ecopet.local`;
  const client = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: "Cliente Teste",
      email: clientEmail,
      password,
      confirmPassword: password,
      phone: `119${String(ts).slice(-8)}`,
      birthDate: "1990-05-15",
    }),
  });
  console.log("[register CLIENT]", client.status);
  assert(client.status === 201, "register client 201");
  assert(client.data.data?.redirectTo === "/dashboard/client", "redirect client");

  // 3. Duplicate email
  const dup = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: "Dup",
      email: clientEmail,
      password,
      confirmPassword: password,
      phone: `118${String(ts).slice(-8)}`,
      birthDate: "1990-01-01",
    }),
  });
  assert(dup.status === 409, "email duplicado 409");

  // 4. Login client
  const login = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: clientEmail, password }),
  });
  assert(login.status === 200, "login ok");
  assert(login.data.data?.user?.email === clientEmail, "user email");
  assert(!login.data.data?.user?.passwordHash, "sem passwordHash");

  // 5. Current user
  const me = await req("/api/auth/me");
  assert(me.status === 200, "me ok");
  assert(me.data.data?.user?.role === "CLIENT", "role client");

  // 6. Wrong password
  const badPwd = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: clientEmail, password: "errada" }),
  });
  assert(badPwd.status === 401, "senha errada 401");

  // 7. Unknown user
  const unknown = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: `naoexiste.${ts}@test.ecopet.local`, password }),
  });
  assert(unknown.status === 401, "usuario inexistente 401");

  // 8. Register PARTNER
  const partnerEmail = `partner.${ts}@test.ecopet.local`;
  const cnpj = generateCnpj();
  const partner = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "PARTNER",
      name: "Responsável Parceiro",
      email: partnerEmail,
      password,
      confirmPassword: password,
      phone: `117${String(ts).slice(-8)}`,
      businessName: "Pet Shop Teste",
      legalName: "Pet Shop Teste LTDA",
      cnpj,
      category: "Pet Shop",
      address: "Rua A, 100",
      city: "São Paulo",
      state: "SP",
    }),
  });
  assert(partner.status === 201, "register partner 201");
  assert(partner.data.data?.redirectTo === "/dashboard/partner", "redirect partner");
  assert(partner.data.data?.user?.accountStatus === "ACTIVE", "partner ACTIVE imediato");
  assert(!partner.data.data?.pendingApproval, "sem pendingApproval no cadastro");

  const partnerMe = await req("/api/auth/me");
  assert(partnerMe.status === 200, "partner sessão após cadastro");
  assert(partnerMe.data.data?.user?.role === "PARTNER", "partner role após cadastro");

  cookieJar.delete("cookie");
  const partnerLogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: partnerEmail, password }),
  });
  assert(partnerLogin.status === 200, "partner login imediato");
  assert(partnerLogin.data.data?.redirectTo === "/dashboard/partner", "partner redirect login");
  assert(partnerLogin.data.data?.user?.accountStatus === "ACTIVE", "partner ACTIVE no login");

  // 9. Duplicate CNPJ
  const dupCnpj = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "ONG",
      name: "ONG Dup",
      email: `ong.dup.${ts}@test.ecopet.local`,
      password,
      confirmPassword: password,
      phone: `116${String(ts).slice(-8)}`,
      ongName: "ONG Dup",
      responsibleName: "Resp",
      cnpj,
      address: "Rua B",
      city: "SP",
      state: "SP",
    }),
  });
  assert(dupCnpj.status === 409, "cnpj duplicado 409");

  // 10. Register ONG
  const ongEmail = `ong.${ts}@test.ecopet.local`;
  const ongCnpj = `${String(Date.now()).slice(-10)}04`.padEnd(14, "0").slice(0, 14);
  const ong = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "ONG",
      name: "Responsável ONG",
      email: ongEmail,
      password,
      confirmPassword: password,
      phone: `115${String(ts).slice(-8)}`,
      ongName: "ONG Amigos dos Pets",
      responsibleName: "Responsável ONG",
      cnpj: ongCnpj,
      address: "Rua C, 50",
      city: "Campinas",
      state: "SP",
    }),
  });
  assert(ong.status === 201, "register ong 201");
  assert(ong.data.data?.user?.accountStatus === "ACTIVE", "ong ACTIVE imediato");
  assert(ong.data.data?.redirectTo === "/dashboard/ong", "redirect ong");

  cookieJar.delete("cookie");
  const ongLogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: ongEmail, password }),
  });
  assert(ongLogin.status === 200, "ong login imediato");
  assert(ongLogin.data.data?.redirectTo === "/dashboard/ong", "ong redirect login");
  assert(ongLogin.data.data?.user?.accountStatus === "ACTIVE", "ong ACTIVE no login");

  // 11. Logout
  const logout = await req("/api/auth/logout", { method: "POST" });
  assert(logout.status === 200, "logout ok");
  const meAfter = await req("/api/auth/me");
  assert(meAfter.status === 401, "me após logout 401");

  console.log("\n✓ Todos os testes de fundação passaram.");
}

main().catch((e) => {
  console.error("\n✗", e.message);
  process.exit(1);
});
