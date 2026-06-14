/**
 * Testes obrigatórios de cadastro/login ECOPET
 */
const base = process.env.API_URL || "http://localhost:4000";
const ts = Date.now();
const email = `test.tutor.${ts}@ecopet.test`;
const password = "SenhaForte@123";

function generateValidCpf() {
  const rnd = () => Math.floor(Math.random() * 9);
  const n = Array.from({ length: 9 }, rnd);
  const d1 =
    n.reduce((s, v, i) => s + v * (10 - i), 0) % 11;
  const check1 = d1 < 2 ? 0 : 11 - d1;
  const d2 =
    [...n, check1].reduce((s, v, i) => s + v * (11 - i), 0) % 11;
  const check2 = d2 < 2 ? 0 : 11 - d2;
  return [...n, check1, check2].join("");
}

const cpf = generateValidCpf();
const phone = `11999${String(ts).slice(-6)}`;

const tutorPayload = {
  role: "TUTOR",
  email,
  password,
  passwordConfirm: password,
  phone,
  acceptTerms: true,
  acceptLgpd: true,
  name: "Test Tutor",
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

async function req(path, opts = {}) {
  const { headers: extraHeaders, ...rest } = opts;
  const res = await fetch(`${base}${path}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log("API:", base);

  const reg = await req("/api/auth/register", { method: "POST", body: JSON.stringify(tutorPayload) });
  assert(reg.status === 201, `Register failed (${reg.status}): ${reg.data.error} ${JSON.stringify(reg.data.details ?? "")}`);
  console.log("✓ Register tutor:", reg.data.user.email);
  const token = reg.data.token;

  const loginEmail = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: email, password }),
  });
  assert(loginEmail.status === 200, `Login email failed: ${loginEmail.data.error}`);
  console.log("✓ Login email");

  const loginCpf = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: cpf, password }),
  });
  assert(loginCpf.status === 200, `Login CPF failed: ${loginCpf.data.error}`);
  console.log("✓ Login CPF");

  const dup = await req("/api/auth/register", { method: "POST", body: JSON.stringify(tutorPayload) });
  assert(dup.status === 409, `Duplicate email should be 409, got ${dup.status}`);
  console.log("✓ Duplicate email blocked");

  const wrong = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: email, password: "wrong" }),
  });
  assert(wrong.status === 401, `Wrong password should be 401, got ${wrong.status}`);
  console.log("✓ Wrong password blocked");

  const notFound = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: "naoexiste@ecopet.test", password: "x" }),
  });
  assert(notFound.status === 401, `User not found should be 401, got ${notFound.status}`);
  console.log("✓ User not found");

  const me = await req("/api/users/me", { headers: { Authorization: `Bearer ${token}` } });
  assert(me.status === 200, `Me failed: ${me.data.error}`);
  assert(me.data.pets?.length === 0, "New user should have no pets");
  console.log("✓ Me — empty pets");

  const pet = await req("/api/pets", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: "Rex",
      species: "DOG",
      breed: "SRD",
      sex: "M",
      color: "Marrom",
      birthDate: "2020-05-01",
    }),
  });
  assert(pet.status === 201, `Create pet failed (${pet.status}): ${pet.data.error}`);
  console.log("✓ Pet created:", pet.data.name);

  const notifs = await req("/api/notifications", { headers: { Authorization: `Bearer ${token}` } });
  assert(notifs.status === 200 && Array.isArray(notifs.data), "Notifications failed");
  assert(notifs.data.length === 0, "New user should have no notifications");
  console.log("✓ Empty notifications");

  console.log("\n✅ All auth tests passed");
}

main().catch((e) => {
  console.error("\n❌", e.message);
  process.exit(1);
});
