/** Manual registration smoke tests — run: node scripts/test-register.mjs */
const BASE = process.env.API_URL || "http://localhost:4000";
const ts = Date.now();
const phone = (n) => `(83) 9999${String(n).padStart(4, "0")}`;
const CPFS = ["52998224725", "11144477735", "39053344705"];
const tutorCpf = CPFS[ts % CPFS.length];

async function req(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

const tutor = {
  role: "TUTOR",
  email: `tutor.${ts}@ecopet.test`,
  password: "Senha@123",
  passwordConfirm: "Senha@123",
  phone: phone(1),
  name: "Tutor Teste",
  cpf: tutorCpf,
  birthDate: "1990-05-15",
  acceptTerms: true,
  acceptLgpd: true,
  primaryInterests: ["Saude"],
  address: {
    street: "Rua Teste",
    number: "100",
    city: "Joao Pessoa",
    state: "PB",
    zipCode: "58000000",
  },
};

const petshop = {
  role: "PETSHOP",
  email: `petshop.${ts}@ecopet.test`,
  password: "Senha@123",
  passwordConfirm: "Senha@123",
  phone: phone(2),
  name: "Pet Shop Teste LTDA",
  tradeName: "Pet Shop Teste",
  cnpj: "19131243000197",
  responsible: "Maria Responsavel",
  hours: "08:00-18:00",
  categories: ["Banho e Tosa"],
  sellsProducts: true,
  offersServices: true,
  acceptTerms: true,
  acceptLgpd: true,
  address: {
    street: "Av Comercial",
    number: "200",
    city: "Joao Pessoa",
    state: "PB",
    zipCode: "58000001",
  },
};

const ong = {
  role: "ONG",
  email: `ong.${ts}@ecopet.test`,
  password: "Senha@123",
  passwordConfirm: "Senha@123",
  phone: phone(3),
  name: "ONG Patinhas",
  tradeName: "ONG Patinhas",
  documentType: "CNPJ",
  documentNumber: "34028316000103",
  responsible: "Joao Protetor",
  actionTypes: ["Adocao"],
  acceptsDonations: true,
  acceptTerms: true,
  acceptLgpd: true,
  address: {
    street: "Rua ONG",
    number: "50",
    city: "Joao Pessoa",
    state: "PB",
    zipCode: "58000002",
  },
};

const tests = [
  ["TUTOR register", "/api/auth/register", tutor],
  ["Duplicate email", "/api/auth/register", tutor],
  ["PETSHOP register", "/api/auth/register", petshop],
  ["ONG register", "/api/auth/register", ong],
  [
    "Weak password",
    "/api/auth/register",
    { ...tutor, email: `weak.${ts}@ecopet.test`, phone: phone(4), password: "123", passwordConfirm: "123" },
  ],
  [
    "Password mismatch",
    "/api/auth/register",
    { ...tutor, email: `mismatch.${ts}@ecopet.test`, phone: phone(5), passwordConfirm: "Outra@123" },
  ],
];

console.log("API:", BASE);
let tutorToken;
for (const [label, path, body] of tests) {
  const { status, json } = await req(path, body);
  console.log(`\n--- ${label} (${status}) ---`);
  console.log(JSON.stringify(json, null, 2));
  if (label === "TUTOR register" && json.token) {
    tutorToken = json.token;
    const hasHash = JSON.stringify(json).includes("passwordHash") || JSON.stringify(json).includes("password_hash");
    console.log("password_hash leaked?", hasHash);
  }
}

if (tutorToken) {
  const login = await req("/api/auth/login", { email: tutor.email, password: tutor.password });
  console.log("\n--- LOGIN after register ---");
  console.log(JSON.stringify(login, null, 2));

  const meRes = await fetch(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${login.json.token || tutorToken}` },
  });
  const me = await meRes.json();
  console.log("\n--- GET /api/auth/me ---");
  console.log(meRes.status, JSON.stringify(me, null, 2));
}
