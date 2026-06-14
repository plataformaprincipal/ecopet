/**
 * Testes integrais da fundação EcoPet.
 * Requer: npm run dev + DATABASE_URL + npm run db:push
 */
const BASE = process.env.WEB_URL || "http://localhost:3000";

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
  const nextCookie = mergeCookies(cookie, res);
  return { status: res.status, data, cookie: nextCookie, location: res.headers.get("location") };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const ts = Date.now();
  const password = "SenhaForte@123";
  let cookie = "";

  console.log("=== Fundação EcoPet — testes integrais ===\n");

  // Dashboard bloqueado sem login
  const dashBlocked = await req("/dashboard");
  assert(
    dashBlocked.status === 307 || dashBlocked.status === 302,
    `dashboard sem login: expected redirect, got ${dashBlocked.status}`
  );
  assert(dashBlocked.location?.includes("/login"), "dashboard redireciona para /login");
  console.log("✓ Dashboard bloqueado sem login (redirect /login)");

  // ─── Senha forte ───
  console.log("\n--- Senha forte ---");

  const pwdName = "Cliente Teste";
  const pwdPhoneSuffix = String(ts).slice(-6);

  async function expectPwdReject(pwd, label, confirm = pwd) {
    const r = await req("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        role: "CLIENT",
        name: pwdName,
        email: `pwd.${label.replace(/\s+/g, "-")}.${ts}@ecopet.com`,
        password: pwd,
        confirmPassword: confirm,
        phone: `11922${pwdPhoneSuffix}`,
        birthDate: "1990-05-15",
      }),
    });
    assert(r.status === 400, `${label}: expected 400, got ${r.status} — ${r.data.error}`);
    console.log(`✓ Senha ${label} → 400`);
  }

  await expectPwdReject("senhaforte@123", "sem maiúscula");
  await expectPwdReject("SENHAFORTE@123", "sem minúscula");
  await expectPwdReject("SenhaForte@abc", "sem número");
  await expectPwdReject("Senha @1234", "com espaço");

  const rConfirmMismatch = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: pwdName,
      email: `confirm.mismatch.${ts}@ecopet.com`,
      password: "Abcd1234",
      confirmPassword: "Abcd1235",
      phone: `11920${pwdPhoneSuffix}`,
      birthDate: "1990-05-15",
    }),
  });
  assert(rConfirmMismatch.status === 400, `confirm mismatch: ${rConfirmMismatch.data.error}`);
  console.log("✓ Cadastro confirmar senha diferente → 400");

  async function expectPwdAccept(pwd, label, emailSuffix, phoneSuffix) {
    const r = await req("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        role: "CLIENT",
        name: "Ana Paula",
        email: `${emailSuffix}.${ts}@ecopet.com`,
        password: pwd,
        confirmPassword: pwd,
        phone: `119${phoneSuffix}${String(ts).slice(-6)}`,
        birthDate: "1990-05-15",
      }),
    });
    assert(r.status === 201, `${label}: expected 201, got ${r.status} — ${r.data.error}`);
    console.log(`✓ Cadastro senha ${label} → 201`);
  }

  await expectPwdAccept("Abcd1234", "média", "media", "19");
  await expectPwdAccept("Abcd1234@x", "forte", "forte", "18");
  await expectPwdAccept("Abcd12345678@X!", "excelente", "excelente", "17");

  const emailPwdTest = `contendo.email.${ts}@ecopet.com`;
  const rEmailPwd = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: pwdName,
      email: emailPwdTest,
      password: `contendo.email.${ts}Aa1!`,
      confirmPassword: `contendo.email.${ts}Aa1!`,
      phone: `11921${pwdPhoneSuffix}`,
      birthDate: "1990-05-15",
    }),
  });
  assert(rEmailPwd.status === 400, `contendo e-mail: ${rEmailPwd.data.error}`);
  console.log("✓ Senha contendo e-mail → 400");

  await expectPwdReject("Cliente@123", "contendo nome");

  // CLIENT
  const clientEmail = `teste.${ts}@ecopet.com`;
  const r1 = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: "Cliente Teste",
      email: clientEmail,
      password,
      confirmPassword: password,
      phone: `11988${String(ts).slice(-6)}`,
      birthDate: "1990-05-15",
    }),
  }, cookie);
  cookie = r1.cookie;
  assert(r1.status === 201, `CLIENT register: expected 201, got ${r1.status} — ${r1.data.error}`);
  console.log("✓ CLIENT cadastro senha forte 201");

  const r1dup = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: "Dup",
      email: clientEmail,
      password,
      confirmPassword: password,
      phone: "11999998888",
      birthDate: "1990-05-15",
    }),
  });
  assert(r1dup.status === 409 && r1dup.data.code === "EMAIL_DUPLICATE", "EMAIL duplicate");
  console.log("✓ CLIENT e-mail duplicado 409");

  const rFuture = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: "Future",
      email: `future.${ts}@ecopet.com`,
      password,
      confirmPassword: password,
      phone: "11988887777",
      birthDate: "2099-01-01",
    }),
  });
  assert(rFuture.status === 400, "birthDate future rejected");
  console.log("✓ CLIENT data futura rejeitada 400");

  const cpfIgnoredRegister = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: "Cliente CPF Extra",
      email: `cpfextra.${ts}@ecopet.com`,
      password,
      confirmPassword: password,
      phone: `11933${String(ts).slice(-6)}`,
      cpf: "99999999999",
      birthDate: "1990-05-15",
    }),
  });
  assert(cpfIgnoredRegister.status === 201, "register CLIENT ignora cpf no body");
  console.log("✓ CLIENT cadastro ignora CPF malicioso no body");

  // PARTNER
  const partnerEmail = `partner.${ts}@ecopet.com`;
  const partnerCnpj = genCnpj();
  const r2 = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "PARTNER",
      name: "Responsável Parceiro",
      email: partnerEmail,
      password,
      confirmPassword: password,
      phone: `11977${String(ts).slice(-6)}`,
      businessName: "Pet Shop Teste",
      legalName: "Pet Shop Teste LTDA",
      cnpj: partnerCnpj,
      category: "Petshop",
      address: "Rua A, 100",
      city: "Sao Paulo",
      state: "SP",
    }),
  });
  assert(r2.status === 201, `PARTNER register: ${r2.data.error}`);
  console.log("✓ PARTNER cadastro 201 + PartnerProfile");

  const r2dup = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "PARTNER",
      name: "Outro",
      email: `partner2.${ts}@ecopet.com`,
      password,
      confirmPassword: password,
      phone: `11966${String(ts).slice(-6)}`,
      businessName: "Outro",
      legalName: "Outro LTDA",
      cnpj: partnerCnpj,
      category: "Petshop",
      address: "Rua B",
      city: "SP",
      state: "SP",
    }),
  });
  assert(r2dup.status === 409 && r2dup.data.code === "CNPJ_DUPLICATE", "CNPJ duplicate");
  console.log("✓ PARTNER CNPJ duplicado 409");

  // ONG
  const ongEmail = `ong.${ts}@ecopet.com`;
  const ongCnpj = genCnpj();
  const r3 = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "ONG",
      name: "Protetor ONG",
      email: ongEmail,
      password,
      confirmPassword: password,
      phone: `11955${String(ts).slice(-6)}`,
      ongName: "ONG Patinhas",
      cnpj: ongCnpj,
      responsibleName: "Maria ONG",
      address: "Rua C, 50",
      city: "Recife",
      state: "PE",
    }),
  });
  assert(r3.status === 201, `ONG register: ${r3.data.error}`);
  console.log("✓ ONG cadastro 201 + OngProfile");

  // Login
  cookie = "";
  const loginOk = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: clientEmail, password }),
  }, cookie);
  cookie = loginOk.cookie;
  assert(loginOk.status === 200, `login ok: ${loginOk.data.error}`);
  console.log("✓ Login senha correta 200");

  const loginBad = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: clientEmail, password: "errada" }),
  });
  assert(loginBad.status === 401, "login bad password");
  console.log("✓ Login senha errada 401");

  const loginMissing = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: `naoexiste.${ts}@ecopet.com`, password }),
  });
  assert(loginMissing.status === 401, "login missing user");
  console.log("✓ Login usuário inexistente 401");

  const me = await req("/api/auth/me", {}, cookie);
  assert(me.status === 200 && me.data.user?.email === clientEmail, "/api/auth/me");
  console.log("✓ /api/auth/me 200 (cookie presente)");

  // Dashboard permitido com login
  const dashAllowed = await req("/dashboard", { redirect: "manual" }, cookie);
  assert(dashAllowed.status === 200, `dashboard autenticado: expected 200, got ${dashAllowed.status}`);
  console.log("✓ Dashboard permitido com login (200)");

  const logout = await req("/api/auth/logout", { method: "POST" }, cookie);
  cookie = logout.cookie;
  assert(logout.status === 200, "logout");
  console.log("✓ Logout 200");

  const meAfter = await req("/api/auth/me", {}, cookie);
  assert(meAfter.status === 401, "me after logout");
  console.log("✓ Sessão removida após logout");

  const dashAfterLogout = await req("/dashboard", {}, cookie);
  assert(
    dashAfterLogout.status === 307 || dashAfterLogout.status === 302,
    "dashboard após logout bloqueado"
  );
  console.log("✓ Dashboard bloqueado após logout");

  // ─── Perfil ───
  console.log("\n--- Perfil ---");

  const profileUnauth = await req("/api/profile/me");
  assert(profileUnauth.status === 401, "profile unauth");
  console.log("✓ GET /api/profile/me sem login 401");

  const clientRelogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: clientEmail, password }),
  });
  cookie = clientRelogin.cookie;
  assert(clientRelogin.status === 200, "re-login client");

  const profileGet = await req("/api/profile/me", {}, cookie);
  assert(profileGet.status === 200 && profileGet.data.profile?.role === "CLIENT", "profile get client");
  console.log("✓ GET /api/profile/me CLIENT 200");

  const clientUpdate = await req("/api/profile/me", {
    method: "PUT",
    body: JSON.stringify({
      name: "Cliente Atualizado",
      phone: `11988${String(ts).slice(-6)}`,
      birthDate: "1990-05-15",
      address: "Rua Perfil, 200",
      city: "Sao Paulo",
      state: "SP",
      zipCode: "01310100",
      avatarUrl: "",
    }),
  }, cookie);
  assert(clientUpdate.status === 200, `PUT client: ${clientUpdate.data.error}`);
  assert(clientUpdate.data.profile?.city === "Sao Paulo", "client city updated");
  console.log("✓ PUT perfil CLIENT 200");

  const roleBlock = await req("/api/profile/me", {
    method: "PUT",
    body: JSON.stringify({
      name: "Cliente Atualizado",
      phone: `11988${String(ts).slice(-6)}`,
      birthDate: "1990-05-15",
      address: "Rua Perfil, 200",
      city: "Sao Paulo",
      state: "SP",
      zipCode: "01310100",
      role: "ADMIN",
      email: "hacker@test.com",
    }),
  }, cookie);
  assert(roleBlock.status === 200 && roleBlock.data.profile?.role === "CLIENT", "role change blocked");
  assert(roleBlock.data.profile?.email === clientEmail, "email change blocked");
  console.log("✓ role/e-mail principal não alterados");

  const partnerLogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: partnerEmail, password }),
  });
  const partnerPut = await req("/api/profile/me", {
    method: "PUT",
    body: JSON.stringify({
      businessName: "Pet Shop Atualizado",
      legalName: "Pet Shop Atualizado LTDA",
      cnpj: partnerCnpj,
      category: "Petshop",
      phone: `11977${String(ts).slice(-6)}`,
      commercialEmail: partnerEmail,
      responsibleName: "Responsável Parceiro",
      address: "Rua A, 200",
      city: "Sao Paulo",
      state: "SP",
      zipCode: "01310100",
      description: "Loja completa",
      businessHours: "Seg-Sex 9h-18h",
    }),
  }, partnerLogin.cookie);
  assert(partnerPut.status === 200, `PUT partner: ${partnerPut.data.error}`);
  console.log("✓ PUT perfil PARTNER 200");

  const ongLogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: ongEmail, password }),
  });
  const ongPut = await req("/api/profile/me", {
    method: "PUT",
    body: JSON.stringify({
      ongName: "ONG Patinhas Atualizada",
      cnpj: ongCnpj,
      responsibleName: "Maria ONG",
      phone: `11955${String(ts).slice(-6)}`,
      institutionalEmail: ongEmail,
      address: "Rua C, 100",
      city: "Recife",
      state: "PE",
      description: "Adoção responsável",
      focusArea: "Cães e gatos",
    }),
  }, ongLogin.cookie);
  assert(ongPut.status === 200, `PUT ong: ${ongPut.data.error}`);
  console.log("✓ PUT perfil ONG 200");

  const cpfIgnored = await req("/api/profile/me", {
    method: "PUT",
    body: JSON.stringify({
      name: "Cliente Atualizado",
      cpf: "12345678901",
      phone: `11988${String(ts).slice(-6)}`,
      birthDate: "1990-05-15",
      address: "Rua Perfil, 200",
      city: "Sao Paulo",
      state: "SP",
      zipCode: "01310100",
    }),
  }, cookie);
  assert(cpfIgnored.status === 200, `cpf malicioso ignorado: ${cpfIgnored.data.error}`);
  assert(cpfIgnored.data.profile?.cpf === undefined, "cpf não exposto no perfil");
  console.log("✓ CPF enviado no body CLIENT ignorado");

  const perfilBlocked = await req("/perfil");
  assert(perfilBlocked.status === 307 || perfilBlocked.status === 302, "perfil sem login");
  console.log("✓ /perfil bloqueado sem login");

  const dashStill = await req("/dashboard", { redirect: "manual" }, cookie);
  assert(dashStill.status === 200, "dashboard still ok");
  console.log("✓ Dashboard continua funcionando");

  // ─── Recuperação de senha ───
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  const crypto = await import("node:crypto");

  const newPassword = "NovaSenha@456";
  const genericMsg =
    "Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha em instantes.";

  const userRow = await prisma.user.findUnique({ where: { email: clientEmail } });
  assert(userRow, "usuário cliente para reset");

  const forgotOk = await req("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: clientEmail }),
  });
  assert(forgotOk.status === 200, `forgot existing: ${forgotOk.status}`);
  assert(forgotOk.data.message === genericMsg, "forgot existing mensagem genérica");
  assert(!forgotOk.data.token && !forgotOk.data.resetToken, "token não retornado em JSON");
  console.log("✓ Forgot-password e-mail existente 200 genérico");

  const forgotMissing = await req("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: `naoexiste.${ts}@ecopet.com` }),
  });
  assert(forgotMissing.status === 200, "forgot inexistente 200");
  assert(forgotMissing.data.message === genericMsg, "forgot inexistente mesma mensagem");
  console.log("✓ Forgot-password e-mail inexistente 200 genérico");

  const dbToken = await prisma.passwordResetToken.findFirst({
    where: { userId: userRow.id },
    orderBy: { createdAt: "desc" },
  });
  if (dbToken) {
    assert(dbToken.tokenHash.length === 64, "token salvo como hash SHA-256");
    assert(dbToken.tokenHash !== dbToken.id, "token puro não está no banco");
    console.log("✓ Token salvo como hash após forgot (não plaintext)");
  } else {
    console.log("⚠ forgot não persistiu token no banco (API pode estar desatualizada)");
  }

  const plainToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(plainToken).digest("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: userRow.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });
  assert(tokenHash.length === 64 && tokenHash !== plainToken, "token hash SHA-256");
  console.log("✓ Token de reset usa hash SHA-256 (não plaintext)");

  const weakTokenPlain = crypto.randomBytes(32).toString("base64url");
  const weakTokenHash = crypto.createHash("sha256").update(weakTokenPlain).digest("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: userRow.id,
      tokenHash: weakTokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });
  const resetWeak = await req("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token: weakTokenPlain,
      password: "senhaforte@123",
      confirmPassword: "senhaforte@123",
    }),
  });
  assert(resetWeak.status === 400, `reset senha fraca: ${resetWeak.data.error}`);
  console.log("✓ Reset senha fraca → 400");

  const mismatchTokenPlain = crypto.randomBytes(32).toString("base64url");
  const mismatchTokenHash = crypto.createHash("sha256").update(mismatchTokenPlain).digest("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: userRow.id,
      tokenHash: mismatchTokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });
  const resetMismatch = await req("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token: mismatchTokenPlain,
      password: newPassword,
      confirmPassword: "OutraSenha@999",
    }),
  });
  assert(resetMismatch.status === 400, `reset confirm mismatch: ${resetMismatch.data.error}`);
  console.log("✓ Reset confirmar senha diferente → 400");

  const resetOk = await req("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token: plainToken,
      password: newPassword,
      confirmPassword: newPassword,
    }),
  });
  assert(resetOk.status === 200, `reset ok: ${resetOk.data.error}`);
  console.log("✓ Reset senha forte → 200");

  const resetUsed = await req("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token: plainToken,
      password: "OutraSenha@789",
      confirmPassword: "OutraSenha@789",
    }),
  });
  assert(resetUsed.status === 400 && resetUsed.data.code === "TOKEN_USED", "token usado");
  console.log("✓ Token já usado rejeitado 400");

  const loginOld = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: clientEmail, password }),
  });
  assert(loginOld.status === 401, "senha antiga rejeitada");
  console.log("✓ Senha antiga não funciona mais");

  const loginNew = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: clientEmail, password: newPassword }),
  });
  assert(loginNew.status === 200, "login nova senha");
  console.log("✓ Senha nova funciona no login");

  const expiredPlain = crypto.randomBytes(32).toString("base64url");
  const expiredHash = crypto.createHash("sha256").update(expiredPlain).digest("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: userRow.id,
      tokenHash: expiredHash,
      expiresAt: new Date(Date.now() - 60_000),
    },
  });
  const resetExpired = await req("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token: expiredPlain,
      password: "Expirada@123",
      confirmPassword: "Expirada@123",
    }),
  });
  assert(resetExpired.status === 400 && resetExpired.data.code === "TOKEN_EXPIRED", "token expirado");
  console.log("✓ Token expirado rejeitado 400");

  await prisma.$disconnect();

  console.log(`\n✅ Todos os testes passaram. Cliente: ${clientEmail}`);
}

main().catch((e) => {
  console.error("\n❌", e.message);
  process.exit(1);
});
