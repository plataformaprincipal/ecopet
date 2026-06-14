/**
 * Auditoria de conflitos 409 no cadastro.
 * Uso: node scripts/audit-register-409.mjs [email] [cpf] [phone]
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API = process.env.API_URL || "http://localhost:4000";

function onlyDigits(v) {
  return String(v ?? "").replace(/\D/g, "");
}

function generateValidCpf() {
  const rnd = () => Math.floor(Math.random() * 9);
  const n = Array.from({ length: 9 }, rnd);
  const d1 = n.reduce((s, v, i) => s + v * (10 - i), 0) % 11;
  const check1 = d1 < 2 ? 0 : 11 - d1;
  const d2 = [...n, check1].reduce((s, v, i) => s + v * (11 - i), 0) % 11;
  const check2 = d2 < 2 ? 0 : 11 - d2;
  return [...n, check1, check2].join("");
}

async function lookupConflicts(email, cpf, phone) {
  const normEmail = email.trim().toLowerCase();
  const normCpf = onlyDigits(cpf);
  const normPhone = onlyDigits(phone);

  const byEmail = await prisma.user.findUnique({
    where: { email: normEmail },
    select: { id: true, email: true, cpf: true, phone: true, role: true, createdAt: true },
  });

  const byCpf = normCpf.length === 11
    ? await prisma.user.findUnique({
        where: { cpf: normCpf },
        select: { id: true, email: true, cpf: true, phone: true, role: true, createdAt: true },
      })
    : null;

  const allPhones = await prisma.user.findMany({
    where: { phone: { not: null } },
    select: { id: true, email: true, cpf: true, phone: true, role: true, createdAt: true },
  });
  const byPhone = allPhones.filter((u) => onlyDigits(u.phone ?? "") === normPhone);

  return { byEmail, byCpf, byPhone, normEmail, normCpf, normPhone };
}

async function listAllUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, cpf: true, phone: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  console.log("\n=== TODOS OS USUÁRIOS NO BANCO ===");
  console.table(
    users.map((u) => ({
      id: u.id.slice(0, 12) + "…",
      email: u.email,
      cpf: u.cpf ?? "",
      phone: u.phone ?? "",
      role: u.role,
      createdAt: u.createdAt.toISOString().slice(0, 10),
    }))
  );
  console.log(`Total: ${users.length}`);
  return users;
}

async function testRegister(email, cpf, phone) {
  const password = "SenhaForte@123";
  const payload = {
    role: "TUTOR",
    email,
    password,
    passwordConfirm: password,
    phone,
    acceptTerms: true,
    acceptLgpd: true,
    name: "Auditoria Teste",
    cpf,
    birthDate: "1990-01-15",
    primaryInterests: ["produtos"],
    address: {
      street: "Rua Teste",
      number: "1",
      district: "Centro",
      city: "Sao Paulo",
      state: "SP",
      zipCode: "01001000",
    },
  };

  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, payload };
}

async function testLogin(email, password) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: email, password }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  const ts = Date.now();
  const probeEmail = process.argv[2] || "valniamalves@gmail.com";
  const probeCpf = process.argv[3] || "88426700497";
  const probePhone = process.argv[4] || "11999999999";

  console.log("=== AUDITORIA 409 — CADASTRO ===\n");
  console.log("Pontos de throw 409 no register:");
  console.log("  registration-validation-service.ts → assertEmailAvailable (EMAIL_DUPLICATE)");
  console.log("  registration-validation-service.ts → assertPhoneAvailable (PHONE_DUPLICATE)");
  console.log("  registration-validation-service.ts → assertCpfAvailable (CPF_DUPLICATE)");
  console.log("  registration-validation-service.ts → assertCnpjAvailable (CNPJ_DUPLICATE)");
  console.log("  register-service.ts → usernameTaken (USERNAME_DUPLICATE)");
  console.log("  middleware/error.ts → Prisma P2002 unique constraint");

  await listAllUsers();

  console.log("\n=== CONSULTAS PARA PAYLOAD INFORMADO ===");
  console.log({ probeEmail, probeCpf, probePhone });
  const conflicts = await lookupConflicts(probeEmail, probeCpf, probePhone);
  console.log("\nSELECT User WHERE email = ?", conflicts.normEmail);
  console.log(conflicts.byEmail ?? "→ nenhum registro");
  console.log("\nSELECT User WHERE cpf = ?", conflicts.normCpf);
  console.log(conflicts.byCpf ?? "→ nenhum registro");
  console.log("\nSELECT User WHERE phone normalizado = ?", conflicts.normPhone);
  console.log(conflicts.byPhone.length ? conflicts.byPhone : "→ nenhum registro");

  console.log("\n=== SEED / DEMO (packages/database/prisma/seed.ts) ===");
  console.log("  admin@ecopet.com.br, gestor@ecopet.com.br, gestorveras@ecopet.com.br");
  console.log("  tutor@ecopet.com.br (CPF 12345678901), vet@ecopet.com.br");
  console.log("  loja@ecopet.com.br (CNPJ 12345678000199), ong@ecopet.com.br");
  console.log("  + usuários @ecopet.test criados por testes automatizados");

  console.log("\n=== TESTE COM E-MAIL NOVO ===");
  const newEmail = `teste.${ts}@ecopet.com`;
  const newCpf = generateValidCpf();
  const newPhone = `11988${String(ts).slice(-6)}`;
  const reg = await testRegister(newEmail, newCpf, newPhone);
  console.log(`POST /api/auth/register → ${reg.status}`, reg.data.error ?? reg.data.user?.email);
  console.log(`  code: ${reg.data.code ?? "—"}`);

  if (reg.status === 201) {
    const login = await testLogin(newEmail, "SenhaForte@123");
    console.log(`POST /api/auth/login → ${login.status}`, login.data.error ?? login.data.user?.email);
  }

  if (conflicts.byEmail) {
    console.log("\n=== DIAGNÓSTICO PARA E-MAIL INFORMADO ===");
    console.log(`409 por EMAIL_DUPLICATE é LEGÍTIMO — registro existente:`);
    console.log(conflicts.byEmail);
  } else if (conflicts.byCpf) {
    console.log("\n=== DIAGNÓSTICO ===");
    console.log(`E-mail livre, mas CPF ${probeCpf} já existe em User:`);
    console.log(conflicts.byCpf);
    console.log("(Se o frontend mostrar mensagem de e-mail, verificar se o 409 veio de EMAIL e não CPF)");
  } else if (conflicts.byPhone.length) {
    console.log("\n=== DIAGNÓSTICO ===");
    console.log(`Telefone ${probePhone} já vinculado:`);
    console.log(conflicts.byPhone);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
