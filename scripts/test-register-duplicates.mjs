/**
 * Testes de duplicidade no cadastro (API direta).
 * Requer API em http://localhost:4000
 */
const API = process.env.API_URL || "http://localhost:4000";

function generateValidCpf(seed = Date.now()) {
  const base = String(seed).replace(/\D/g, "").slice(-9).padStart(9, "0");
  const n = base.split("").map(Number);
  const d1 = n.reduce((s, v, i) => s + v * (10 - i), 0) % 11;
  const check1 = d1 < 2 ? 0 : 11 - d1;
  const d2 = [...n, check1].reduce((s, v, i) => s + v * (11 - i), 0) % 11;
  const check2 = d2 < 2 ? 0 : 11 - d2;
  return [...n, check1, check2].join("");
}

function generateValidCnpj() {
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

function baseTutorPayload(ts, cpf, email) {
  return {
    role: "TUTOR",
    email,
    password: "SenhaForte@123",
    passwordConfirm: "SenhaForte@123",
    phone: `11977${String(ts).slice(-6)}`,
    acceptTerms: true,
    acceptLgpd: true,
    name: "Test User",
    cpf,
    birthDate: "1990-01-15",
    primaryInterests: ["produtos"],
    address: {
      street: "Rua Teste",
      number: "100",
      district: "Centro",
      city: "Sao Paulo",
      state: "SP",
      zipCode: "01001000",
    },
  };
}

function basePetshopPayload(ts, cnpj, email) {
  return {
    role: "PETSHOP",
    email,
    password: "SenhaForte@123",
    passwordConfirm: "SenhaForte@123",
    phone: `11966${String(ts).slice(-6)}`,
    acceptTerms: true,
    acceptLgpd: true,
    name: "Petshop Teste LTDA",
    tradeName: "Petshop Teste",
    cnpj,
    responsible: "Responsavel Teste",
    sellsProducts: true,
    offersServices: false,
    categories: ["racao"],
    hours: "9h-18h",
    address: {
      street: "Rua Teste",
      number: "200",
      district: "Centro",
      city: "Sao Paulo",
      state: "SP",
      zipCode: "01001000",
    },
  };
}

function baseOngCpfPayload(ts, cpf, email) {
  return {
    role: "ONG",
    email,
    password: "SenhaForte@123",
    passwordConfirm: "SenhaForte@123",
    phone: `11955${String(ts).slice(-6)}`,
    acceptTerms: true,
    acceptLgpd: true,
    name: "Protetor Teste",
    documentType: "CPF",
    documentNumber: cpf,
    responsible: "Protetor Teste",
    actionTypes: ["adocao"],
    address: {
      street: "Rua Teste",
      number: "300",
      district: "Centro",
      city: "Sao Paulo",
      state: "SP",
      zipCode: "01001000",
    },
  };
}

async function register(payload) {
  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function login(identifier, password) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function me(token) {
  const res = await fetch(`${API}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const ts = Date.now();
  let passed = 0;

  // 1. novo e-mail → 201
  const email1 = `dup.test.${ts}@ecopet.test`;
  const cpf1 = generateValidCpf(ts);
  const r1 = await register(baseTutorPayload(ts, cpf1, email1));
  assert(r1.status === 201, `Test 1: expected 201, got ${r1.status} — ${r1.data.error}`);
  passed++;
  console.log("✓ 1. cadastro e-mail único → 201");

  // 2. mesmo e-mail → EMAIL_DUPLICATE
  const r2 = await register(baseTutorPayload(ts + 1, generateValidCpf(ts + 1), email1));
  assert(r2.status === 409, `Test 2: expected 409, got ${r2.status}`);
  assert(r2.data.code === "EMAIL_DUPLICATE", `Test 2: expected EMAIL_DUPLICATE, got ${r2.data.code}`);
  assert(
    r2.data.error?.includes("e-mail"),
    `Test 2: expected email-specific message, got "${r2.data.error}"`
  );
  passed++;
  console.log("✓ 2. e-mail duplicado → EMAIL_DUPLICATE");

  // 3. CPF único → 201
  const email3 = `dup.cpf.${ts}@ecopet.test`;
  const cpf3 = generateValidCpf(ts + 2);
  const r3 = await register(baseTutorPayload(ts + 2, cpf3, email3));
  assert(r3.status === 201, `Test 3: expected 201, got ${r3.status} — ${r3.data.error}`);
  passed++;
  console.log("✓ 3. CPF único → 201");

  // 4. mesmo CPF → CPF_DUPLICATE
  const r4 = await register(baseTutorPayload(ts + 3, cpf3, `dup.cpf2.${ts}@ecopet.test`));
  assert(r4.status === 409, `Test 4: expected 409, got ${r4.status}`);
  assert(r4.data.code === "CPF_DUPLICATE", `Test 4: expected CPF_DUPLICATE, got ${r4.data.code}`);
  assert(r4.data.error?.includes("CPF"), `Test 4: expected CPF message, got "${r4.data.error}"`);
  passed++;
  console.log("✓ 4. CPF duplicado → CPF_DUPLICATE");

  // 5. petshop sem CNPJ vazio colidindo — payload sem cnpj falha validação 400, não 409 falso
  const r5 = await register({
    ...basePetshopPayload(ts + 4, generateValidCnpj(ts + 4), `dup.ps.${ts}@ecopet.test`),
    cnpj: "",
  });
  assert(r5.status === 400, `Test 5: expected 400 validation, got ${r5.status}`);
  passed++;
  console.log("✓ 5. petshop CNPJ vazio → 400 (sem falso positivo 409)");

  // 6. tutor sem campos de parceiro — não colide por null
  const email6 = `dup.client.${ts}@ecopet.test`;
  const r6 = await register(baseTutorPayload(ts + 5, generateValidCpf(ts + 5), email6));
  assert(r6.status === 201, `Test 6: expected 201, got ${r6.status} — ${r6.data.error}`);
  passed++;
  console.log("✓ 6. cliente sem campos parceiro → 201");

  // 7. parceiro (petshop) sem CPF — não colide por CPF vazio
  const email7 = `dup.ps2.${ts}@ecopet.test`;
  const r7 = await register(basePetshopPayload(ts + 6, generateValidCnpj(ts + 6), email7));
  assert(r7.status === 201, `Test 7: expected 201, got ${r7.status} — ${r7.data.error}`);
  passed++;
  console.log("✓ 7. parceiro sem CPF → 201");

  // 8. ONG CPF sem colidir por CPF vazio
  const email8 = `dup.ong.${ts}@ecopet.test`;
  const cpf8 = generateValidCpf(ts + 7);
  const r8 = await register(baseOngCpfPayload(ts + 7, cpf8, email8));
  assert(r8.status === 201, `Test 8: expected 201, got ${r8.status} — ${r8.data.error}`);
  passed++;
  console.log("✓ 8. ONG com CPF → 201");

  // 9. login do usuário criado
  const loginRes = await login(email6, "SenhaForte@123");
  assert(loginRes.status === 200, `Test 9: expected 200 login, got ${loginRes.status}`);
  passed++;
  console.log("✓ 9. login → 200");

  // 10. GET /api/users/me
  const token = loginRes.data.token;
  const meRes = await me(token);
  assert(meRes.status === 200, `Test 10: expected 200 me, got ${meRes.status}`);
  assert(meRes.data.email === email6, `Test 10: wrong email ${meRes.data.email}`);
  passed++;
  console.log("✓ 10. GET /api/users/me → userId correto");

  console.log(`\n✅ ${passed}/10 testes de duplicidade passaram`);
  console.log(`   Usuário de teste: ${email6}`);
}

main().catch((e) => {
  console.error("\n❌", e.message);
  process.exit(1);
});
