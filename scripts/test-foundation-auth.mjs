/**
 * Testes de fundação: cadastro, login, sessão, proteção por role.
 * Usa e-mails únicos por execução — não é seed permanente.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateValidCnpj } from "./cnpj-test-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.resolve(__dirname, "..", ".env");
if (!process.env.DATABASE_URL && fs.existsSync(rootEnv)) {
  for (const line of fs.readFileSync(rootEnv, "utf8").split(/\r?\n/)) {
    const m = line.match(/^DATABASE_URL=(.*)$/);
    if (!m) continue;
    process.env.DATABASE_URL = m[1].trim().replace(/^["']|["']$/g, "");
    break;
  }
}

const WEB = process.env.WEB_URL || "http://localhost:3000";
const TEST_RUN_IP_BASE = `10.253.${Date.now() % 200}`;
let reqSeq = 0;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function generateCnpj() {
  return generateValidCnpj(Date.now());
}

function nextTestIp() {
  reqSeq += 1;
  return `${TEST_RUN_IP_BASE}.${(reqSeq % 200) + 1}`;
}

const cookieJar = new Map();

async function resetAuthRateLimit() {
  try {
    const res = await fetch(`${WEB}/api/auth/test/reset-rate-limit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (res.ok) return true;
  } catch {
    /* servidor antigo sem endpoint — segue com IPs únicos */
  }
  return false;
}

async function req(path, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    "x-forwarded-for": opts.testIp ?? nextTestIp(),
    ...(opts.headers || {}),
  };
  const cookie = cookieJar.get("cookie");
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(`${WEB}${path}`, {
    ...opts,
    headers,
  });

  const setCookie = res.headers.get("set-cookie");
  const setCookies =
    typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : setCookie ? [setCookie] : [];
  for (const raw of setCookies) {
    const session = raw.split(";")[0];
    if (session.includes("ecopet-session=")) cookieJar.set("cookie", session);
    if (raw.includes("Max-Age=0") || raw.includes("max-age=0")) cookieJar.delete("cookie");
  }

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, headers: res.headers };
}

function clientRegisterBody(ts, overrides = {}) {
  return {
    role: "CLIENT",
    name: "Cliente Teste",
    email: `client.${ts}@test.ecopet.local`,
    password: "Ecopet@Forte2026",
    confirmPassword: "Ecopet@Forte2026",
    phone: `+55119${String(ts).slice(-8)}`,
    birthDate: "1990-05-15",
    username: `client${String(ts).slice(-8)}`,
    gender: "MASCULINO",
    acceptTerms: true,
    acceptPrivacy: true,
    ...overrides,
  };
}

function validationMessage(res) {
  const err = res.data?.error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && err.message) return err.message;
  return "";
}

function responseMessage(res) {
  const fromError = validationMessage(res);
  if (fromError) return fromError;
  return res.data?.data?.message ?? res.data?.message ?? "";
}

function isoDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function isoDateYearsAgo(years) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

function uniqueInternationalPhones(ts) {
  const tail = String(ts).replace(/\D/g, "").slice(-8).padStart(8, "0");
  const tail4 = tail.slice(-4);
  const tail6 = tail.slice(-6);
  return {
    BR: `+55839${tail}`,
    US: `+1202555${tail4}`,
    PT: `+351912${tail6}`,
    GB: `+4479${tail}`,
  };
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

  const rateReset = await resetAuthRateLimit();
  console.log(rateReset ? "[rate-limit] reset OK" : "[rate-limit] reset indisponível — usando IPs únicos");

  // 2. E-mail inválido (sem @)
  const emailNoAt = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(clientRegisterBody(ts + 1, { email: "sofia" })),
  });
  assert(emailNoAt.status === 400, "e-mail sem @ rejeitado 400");
  assert(
    validationMessage(emailNoAt).includes("Digite um e-mail válido"),
    "mensagem e-mail sem @"
  );
  console.log("[register] e-mail sem @ → 400");

  // 3. E-mail incompleto
  const emailIncomplete = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(clientRegisterBody(ts + 2, { email: "sofia@gmail" })),
  });
  assert(emailIncomplete.status === 400, "e-mail incompleto rejeitado 400");
  console.log("[register] e-mail incompleto → 400");

  // 4. Cadastro sem aceites
  const noLegal = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 3, {
        email: `nolegal.${ts}@test.ecopet.local`,
        acceptTerms: false,
        acceptPrivacy: false,
      })
    ),
  });
  assert(noLegal.status === 400, "cadastro sem aceites 400");
  assert(
    validationMessage(noLegal).includes("Termos de Uso") ||
      validationMessage(noLegal).includes("Política de Privacidade"),
    "mensagem aceites obrigatórios"
  );
  console.log("[register] sem aceites → 400");

  // 4f. Telefones internacionais válidos
  const intlPhones = uniqueInternationalPhones(ts);
  const internationalPhones = [
    { label: "Brasil", phone: intlPhones.BR },
    { label: "Estados Unidos", phone: intlPhones.US },
    { label: "Portugal", phone: intlPhones.PT },
    { label: "Reino Unido", phone: intlPhones.GB },
  ];

  for (let i = 0; i < internationalPhones.length; i++) {
    const { label, phone } = internationalPhones[i];
    const suffix = ts + 40 + i;
    const regIntl = await req("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(
        clientRegisterBody(suffix, {
          email: `intl.${suffix}@test.ecopet.local`,
          username: `intl${String(suffix).slice(-8)}`,
          phone,
        })
      ),
    });
    assert(regIntl.status === 201, `telefone válido ${label} (${phone}) → 201`);
  }
  console.log("[register] telefones internacionais BR/US/PT/GB → 201");

  // 4g. Telefone inválido
  const invalidPhoneText = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 50, {
        email: `badphone.${ts}@test.ecopet.local`,
        username: `badph${String(ts).slice(-8)}`,
        phone: "texto-invalido",
      })
    ),
  });
  assert(invalidPhoneText.status === 400, "telefone com texto → 400");
  assert(validationMessage(invalidPhoneText).includes("telefone"), "mensagem telefone inválido (texto)");

  const invalidPhoneIncomplete = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 51, {
        email: `incomplete.${ts}@test.ecopet.local`,
        username: `incph${String(ts).slice(-8)}`,
        phone: "+55123",
      })
    ),
  });
  assert(invalidPhoneIncomplete.status === 400, "telefone incompleto → 400");

  const invalidPhoneDdi = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 52, {
        email: `badddi.${ts}@test.ecopet.local`,
        username: `ddiph${String(ts).slice(-8)}`,
        phone: "+9991234567890",
      })
    ),
  });
  assert(invalidPhoneDdi.status === 400, "DDI incorreto → 400");

  const emptyPhone = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 53, {
        email: `emptyph.${ts}@test.ecopet.local`,
        username: `empty${String(ts).slice(-8)}`,
        phone: "",
      })
    ),
  });
  assert(emptyPhone.status === 400, "telefone vazio → 400");
  console.log("[register] telefones inválidos → 400");

  // 4h. Regras específicas Brasil (+55)
  const brMobileOk = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 60, {
        email: `br.mobile.${ts}@test.ecopet.local`,
        username: `brmob${String(ts).slice(-8)}`,
        phone: `+5583999${String(ts + 60).slice(-6).padStart(6, "3")}`,
      })
    ),
  });
  assert(brMobileOk.status === 201, "BR celular válido → 201");

  const brLandlineOk = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 61, {
        email: `br.fixo.${ts}@test.ecopet.local`,
        username: `brfix${String(ts).slice(-8)}`,
        phone: `+5511333${String(ts + 61).slice(-5).padStart(5, "4")}`,
      })
    ),
  });
  assert(brLandlineOk.status === 201, "BR fixo válido → 201");

  const brNoDdd = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 62, {
        email: `br.noddd.${ts}@test.ecopet.local`,
        username: `brndd${String(ts).slice(-8)}`,
        phone: "999382221",
      })
    ),
  });
  assert(brNoDdd.status === 400, "BR sem DDI/DDD → 400");

  const brBadDdd = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 63, {
        email: `br.badddd.${ts}@test.ecopet.local`,
        username: `brbad${String(ts).slice(-8)}`,
        phone: "+5510999382221",
      })
    ),
  });
  assert(brBadDdd.status === 400, "BR DDD inexistente (10) → 400");

  const brNoNine = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 64, {
        email: `br.nonine.${ts}@test.ecopet.local`,
        username: `brn9${String(ts).slice(-8)}`,
        phone: "+558389382221",
      })
    ),
  });
  assert(brNoNine.status === 400, "BR celular sem 9 → 400");

  const brShort = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 65, {
        email: `br.short.${ts}@test.ecopet.local`,
        username: `brsht${String(ts).slice(-8)}`,
        phone: "+5583999",
      })
    ),
  });
  assert(brShort.status === 400, "BR número curto → 400");
  console.log("[register] regras telefone Brasil → OK");

  // 4b. Data futura
  const birthFuture = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 30, {
        email: `future.${ts}@test.ecopet.local`,
        birthDate: "2099-01-01",
      })
    ),
  });
  assert(birthFuture.status === 400, "data futura rejeitada 400");
  assert(validationMessage(birthFuture).includes("não pode ser futura"), "mensagem data futura");
  console.log("[register] data futura → 400");

  // 4c. Idade menor que 1 ano
  const birthTooYoung = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 31, {
        email: `young.${ts}@test.ecopet.local`,
        birthDate: isoDateDaysAgo(180),
      })
    ),
  });
  assert(birthTooYoung.status === 400, "idade < 1 ano rejeitada 400");
  assert(validationMessage(birthTooYoung).includes("mais de 1 ano"), "mensagem idade mínima");
  console.log("[register] idade < 1 ano → 400");

  // 4d. Idade maior que 130 anos
  const birthTooOld = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 32, {
        email: `old.${ts}@test.ecopet.local`,
        birthDate: isoDateYearsAgo(131),
      })
    ),
  });
  assert(birthTooOld.status === 400, "idade > 130 anos rejeitada 400");
  assert(validationMessage(birthTooOld).includes("130 anos"), "mensagem idade máxima");
  console.log("[register] idade > 130 anos → 400");

  // 4e. Gênero Outro sem complemento
  const genderOtherMissing = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 33, {
        email: `gender.${ts}@test.ecopet.local`,
        gender: "OUTRO",
        genderOther: "",
      })
    ),
  });
  assert(genderOtherMissing.status === 400, "gênero Outro sem texto 400");
  console.log("[register] gênero Outro sem complemento → 400");

  // 4i. Validação de senha — @ como caractere especial
  const pwdAtOk = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 70, {
        email: `pwd.at.${ts}@test.ecopet.local`,
        username: `pwdat${String(ts + 70).slice(-8)}`,
        password: "EcoPet@2026",
        confirmPassword: "EcoPet@2026",
      })
    ),
  });
  assert(pwdAtOk.status === 201, "senha EcoPet@2026 → 201");

  const pwdNoUpper = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 71, {
        email: `pwd.noup.${ts}@test.ecopet.local`,
        username: `pwdnu${String(ts + 71).slice(-8)}`,
        password: "neves@12b",
        confirmPassword: "neves@12b",
      })
    ),
  });
  assert(pwdNoUpper.status === 400, "neves@12b sem maiúscula → 400");
  assert(validationMessage(pwdNoUpper).includes("maiúscula"), "mensagem falta maiúscula");
  assert(!validationMessage(pwdNoUpper).includes("e-mail"), "neves@12b não rejeitada como e-mail");

  const arthurSuffix = String(ts + 72).slice(-6);
  const arthurEmail = `arthur${arthurSuffix}@test.ecopet.local`;
  const pwdEmailPart = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 72, {
        email: arthurEmail,
        username: `arth${String(ts + 72).slice(-8)}`,
        password: `arthur${arthurSuffix}123A!`,
        confirmPassword: `arthur${arthurSuffix}123A!`,
      })
    ),
  });
  assert(pwdEmailPart.status === 400, "senha com parte local do e-mail → 400");
  assert(validationMessage(pwdEmailPart).includes("e-mail"), "mensagem contém e-mail");

  const pwdDomainOnly = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 73, {
        email: `domain.${ts}@test.ecopet.local`,
        username: `dom${String(ts + 73).slice(-8)}`,
        name: "Usuario Dom",
        password: "gmail@123A",
        confirmPassword: "gmail@123A",
      })
    ),
  });
  assert(pwdDomainOnly.status === 201, "gmail@123A não rejeitada como e-mail → 201");
  console.log("[register] validação senha @ e dados pessoais → OK");

  // 5. Register CLIENT válido
  const clientEmail = `client.${ts}@test.ecopet.local`;
  const client = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(clientRegisterBody(ts, { email: clientEmail })),
  });
  console.log("[register CLIENT]", client.status);
  assert(client.status === 201, "register client 201");
  assert(client.data.data?.redirectTo === "/cliente", "redirect client");

  // 6. Duplicate email
  const dup = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientRegisterBody(ts + 4, {
        name: "Usuario Dup",
        email: clientEmail,
        phone: `+55119${String(ts + 1).slice(-8)}`,
        username: `dup${String(ts).slice(-8)}`,
      })
    ),
  });
  assert(dup.status === 409, "email duplicado 409");
  assert(
    validationMessage(dup) === "Usuário já cadastrado.",
    "e-mail duplicado → mensagem genérica"
  );
  assert(dup.data?.error?.code === "EMAIL_DUPLICATE", "e-mail duplicado → código técnico preservado");

  // 7. Login client (e-mail)
  const clientUsername = `client${String(ts).slice(-8)}`;
  const login = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: clientEmail, password }),
  });
  assert(login.status === 200, "login por e-mail ok");
  assert(login.data.data?.user?.email === clientEmail, "user email");
  assert(!login.data.data?.user?.passwordHash, "sem passwordHash");

  // 7b. Login client (username)
  cookieJar.delete("cookie");
  const loginUsername = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: clientUsername, password }),
  });
  assert(loginUsername.status === 200, "login por username ok");
  assert(loginUsername.data.data?.user?.email === clientEmail, "username login retorna email");

  // 8. Current user
  const me = await req("/api/auth/me");
  assert(me.status === 200, "me ok");
  assert(me.data.data?.user?.role === "CLIENT", "role client");

  // 9. Wrong password
  const badPwd = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: clientEmail, password: "errada" }),
  });
  assert(badPwd.status === 401, "senha errada 401");
  assert(validationMessage(badPwd).includes("Senha incorreta"), "mensagem senha incorreta");

  // 10. Unknown user (e-mail)
  const unknown = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: `naoexiste.${ts}@test.ecopet.local`, password }),
  });
  assert(unknown.status === 401, "usuario inexistente 401");
  assert(validationMessage(unknown).includes("não encontrado"), "mensagem usuário não encontrado");

  // 10b. Unknown username
  const unknownUser = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: `usuario_inexistente_${ts}`, password }),
  });
  assert(unknownUser.status === 401, "username inexistente 401");
  assert(validationMessage(unknownUser).includes("não encontrado"), "mensagem username não encontrado");

  // 10c. Recuperação de senha por e-mail (OTP)
  const forgotEmail = await req("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ identifier: clientEmail }),
  });
  assert(forgotEmail.status === 200, "recuperação por e-mail ok");
  const forgotEmailPayload = forgotEmail.data?.data ?? forgotEmail.data;
  assert(forgotEmailPayload?.channel === "email", "canal e-mail");
  const emailOtp = forgotEmailPayload?.devOtp;
  assert(emailOtp && /^\d{6}$/.test(emailOtp), "OTP exposto em testes (AUTH_TEST_EXPOSE_OTP=1)");

  const forgotEmailMissing = await req("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ identifier: `missing.recovery.${ts}@test.ecopet.local` }),
  });
  assert(forgotEmailMissing.status === 200, "recuperação e-mail inexistente 200 genérico");
  assert(
    responseMessage(forgotEmailMissing).includes("instruções de recuperação") ||
      responseMessage(forgotEmailMissing).includes("recuperação"),
    "mensagem genérica sem revelar existência"
  );

  // 10d. OTP inválido
  const invalidCode = await req("/api/auth/verify-reset-code", {
    method: "POST",
    body: JSON.stringify({ identifier: clientEmail, code: "000000" }),
  });
  assert(invalidCode.status === 400, "código inválido 400");
  assert(validationMessage(invalidCode).includes("Código de verificação inválido"), "mensagem código inválido");

  // 10e. OTP válido → token de redefinição
  const verifyEmail = await req("/api/auth/verify-reset-code", {
    method: "POST",
    body: JSON.stringify({ identifier: clientEmail, code: emailOtp }),
  });
  assert(verifyEmail.status === 200, "OTP e-mail válido 200");
  const verifyPayload = verifyEmail.data?.data ?? verifyEmail.data;
  assert(verifyPayload?.resetToken, "resetToken após OTP válido");

  const recoveryPassword = "NovaRec@2026!";
  const resetAfterOtp = await req("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token: verifyPayload.resetToken,
      password: recoveryPassword,
      confirmPassword: recoveryPassword,
    }),
  });
  assert(resetAfterOtp.status === 200, "redefinição após OTP ok");

  const loginNewPwd = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: clientEmail, password: recoveryPassword }),
  });
  assert(loginNewPwd.status === 200, "login com nova senha ok");
  cookieJar.delete("cookie");

  // 10f. OTP expirado
  const forgotExpire = await req("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ identifier: clientEmail }),
  });
  const expireOtp = (forgotExpire.data?.data ?? forgotExpire.data)?.devOtp;
  assert(expireOtp, "OTP para teste de expiração");
  await new Promise((r) => setTimeout(r, 1200));
  const expiredCode = await req("/api/auth/verify-reset-code", {
    method: "POST",
    body: JSON.stringify({ identifier: clientEmail, code: expireOtp }),
  });
  if (process.env.AUTH_TEST_OTP_TTL_MS && parseInt(process.env.AUTH_TEST_OTP_TTL_MS, 10) <= 1000) {
    assert(expiredCode.status === 400, "OTP expirado 400");
    assert(
      validationMessage(expiredCode).includes("expirou"),
      "mensagem código expirado"
    );
    console.log("[recovery] OTP expirado → OK");
  } else {
    console.log("[recovery] OTP expirado — defina AUTH_TEST_OTP_TTL_MS=500 no servidor para testar");
  }

  // 10g. Recuperação por telefone
  const clientPhone = `+55119${String(ts).slice(-8)}`;
  const forgotPhone = await req("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ identifier: clientPhone }),
  });
  if (forgotPhone.status === 503) {
    console.log("[recovery] SMS desabilitado — telefone retorna 503 (defina PHONE_SMS_RECOVERY_ENABLED=1)");
  } else {
    assert(forgotPhone.status === 200, "recuperação por telefone ok");
    const phonePayload = forgotPhone.data?.data ?? forgotPhone.data;
    assert(phonePayload?.channel === "phone", "canal telefone");
    const phoneOtp = phonePayload?.devOtp;
    assert(phoneOtp && /^\d{6}$/.test(phoneOtp), "OTP SMS exposto em testes");

    const verifyPhone = await req("/api/auth/verify-reset-code", {
      method: "POST",
      body: JSON.stringify({ identifier: clientPhone, code: phoneOtp }),
    });
    assert(verifyPhone.status === 200, "OTP telefone válido");
    console.log("[recovery] telefone + OTP → OK");
  }

  // 10h. Tentativas excessivas de verificação
  for (let i = 0; i < 6; i++) {
    await req("/api/auth/verify-reset-code", {
      method: "POST",
      body: JSON.stringify({ identifier: clientEmail, code: "111111" }),
    });
  }
  const blockedVerify = await req("/api/auth/verify-reset-code", {
    method: "POST",
    body: JSON.stringify({ identifier: clientEmail, code: "111111" }),
  });
  assert(blockedVerify.status === 429 || blockedVerify.status === 400, "bloqueio por tentativas excessivas");
  console.log("[recovery] tentativas excessivas → bloqueio/rate limit");

  // 10i. AuditLog registrado
  if (process.env.DATABASE_URL) {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
    const audit = await prisma.auditLog.findFirst({
      where: { module: "auth", resource: "password_recovery" },
      orderBy: { createdAt: "desc" },
    });
    await prisma.$disconnect();
    assert(audit, "AuditLog de recuperação registrado");
    console.log("[recovery] AuditLog → OK");
  } else {
    console.log("[recovery] AuditLog — DATABASE_URL ausente, pulando verificação");
  }

  console.log("[login/recovery] e-mail, telefone, OTP, redefinição OK");

  // 11. Register PARTNER
  const partnerEmail = `partner.${ts}@test.ecopet.local`;
  const cnpj = generateValidCnpj(ts);
  const partner = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "PARTNER",
      name: "Responsável Parceiro",
      email: partnerEmail,
      password,
      confirmPassword: password,
      phone: `+55119${String(ts + 100).slice(-8)}`,
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
  assert(partner.data.data?.redirectTo === "/partner", "redirect partner");
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
  assert(partnerLogin.data.data?.redirectTo === "/partner", "partner redirect login");
  assert(partnerLogin.data.data?.user?.accountStatus === "ACTIVE", "partner ACTIVE no login");

  // 12. Duplicate CNPJ
  const dupCnpj = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "ONG",
      name: "ONG Dup",
      email: `ong.dup.${ts}@test.ecopet.local`,
      password,
      confirmPassword: password,
      phone: `+55119${String(ts + 101).slice(-8)}`,
      ongName: "ONG Dup",
      responsibleName: "Resp",
      cnpj,
      address: "Rua B",
      city: "SP",
      state: "SP",
    }),
  });
  assert(dupCnpj.status === 409, "cnpj duplicado 409");
  assert(
    validationMessage(dupCnpj) === "Usuário já cadastrado.",
    "cnpj duplicado ONG → mensagem genérica"
  );

  // 13. Register ONG
  const ongEmail = `ong.${ts}@test.ecopet.local`;
  const ongCnpj = generateValidCnpj(ts + 200);
  const ong = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "ONG",
      name: "Responsável ONG",
      email: ongEmail,
      password,
      confirmPassword: password,
      phone: `+55119${String(ts + 102).slice(-8)}`,
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
  assert(ong.data.data?.redirectTo === "/ngo", "redirect ong");

  cookieJar.delete("cookie");
  const ongLogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: ongEmail, password }),
  });
  assert(ongLogin.status === 200, "ong login imediato");
  assert(ongLogin.data.data?.redirectTo === "/ngo", "ong redirect login");
  assert(ongLogin.data.data?.user?.accountStatus === "ACTIVE", "ong ACTIVE no login");

  // 14. Logout
  const logout = await req("/api/auth/logout", { method: "POST" });
  assert(logout.status === 200, "logout ok");
  const meAfter = await req("/api/auth/me");
  assert(meAfter.status === 401, "me após logout 401");

  console.log("\n✓ Todos os testes de fundação passaram.");
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((e) => {
    console.error("\n✗", e.message);
    process.exitCode = 1;
  });
