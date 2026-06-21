/**
 * Testes de cadastro ONG + unicidade global de CPF/CNPJ + mensagem pública padronizada.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateValidCnpj, generateValidCpf } from "./cnpj-test-utils.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WEB = process.env.WEB_URL || "http://localhost:3000";
const password = "Ecopet@Forte2026";

const USER_ALREADY_REGISTERED_MESSAGE = "Usuário já cadastrado.";

function readSrc(relativePath) {
  return readFileSync(join(ROOT, "apps/web/src", relativePath), "utf8");
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function validationMessage(res) {
  const err = res.data?.error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && err.message) return err.message;
  return "";
}

function errorCode(res) {
  const err = res.data?.error;
  if (err && typeof err === "object" && err.code) return err.code;
  return res.data?.code ?? "";
}

function assertDuplicateResponse(res, expectedCode) {
  assert(res.status === 409, `esperado 409, recebeu ${res.status}`);
  assert(errorCode(res) === expectedCode, `código técnico ${expectedCode}, recebeu ${errorCode(res)}`);
  assert(
    validationMessage(res) === USER_ALREADY_REGISTERED_MESSAGE,
    `mensagem pública deve ser genérica — recebeu: ${validationMessage(res)}`
  );
}

async function req(path, opts = {}) {
  const res = await fetch(`${WEB}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function clientPayload(ts, overrides = {}) {
  const suffix = String(ts).slice(-8);
  return {
    role: "CLIENT",
    name: "Cliente Teste Silva",
    email: `client.${ts}@test.ecopet.local`,
    phone: `+55119${suffix}`,
    username: `cli${suffix}`,
    birthDate: "1990-05-20",
    gender: "MASCULINO",
    password,
    confirmPassword: password,
    acceptTerms: true,
    acceptPrivacy: true,
    ...overrides,
  };
}

function autonomousPartnerPayload(ts, overrides = {}) {
  const suffix = String(ts).slice(-8);
  return {
    role: "PARTNER",
    partnerType: "AUTONOMOUS",
    name: "Parceiro Teste Silva",
    email: `auto.${ts}@test.ecopet.local`,
    phone: `+55119${suffix}`,
    username: `aut${suffix}`,
    activityStartDate: "2018-03-15",
    activityAreas: ["SAUDE_ANIMAL"],
    businessDescription:
      "Atuo há anos com cuidados veterinários e estética pet, oferecendo banho, tosa e consultas preventivas com foco no bem-estar animal e atendimento humanizado.",
    addressDetails: {
      zipCode: "01310-100",
      streetType: "Avenida",
      street: "Paulista",
      number: "1000",
      district: "Bela Vista",
      city: "São Paulo",
      state: "SP",
    },
    operationDetails: {
      modes: ["BY_APPOINTMENT"],
      serviceRadius: "KM_10",
      deliveryOptions: [],
    },
    financialDetails: {
      paymentMethods: ["Pix"],
      pixKeyType: "E-mail",
      pixKey: `auto.${ts}@test.ecopet.local`,
    },
    cpf: generateValidCpf(ts),
    professionalName: "Pet Care Autônomo",
    password,
    confirmPassword: password,
    acceptTerms: true,
    acceptPrivacy: true,
    providedDocumentTypes: ["LEGAL_REP_ID", "RESIDENCE_PROOF"],
    ...overrides,
  };
}

function ongPayload(ts, overrides = {}) {
  const suffix = String(ts).slice(-8);
  return {
    role: "ONG",
    name: "Responsável ONG",
    email: `ong.${ts}@test.ecopet.local`,
    phone: `+55119${suffix}`,
    ongName: "ONG Amigos dos Pets",
    responsibleName: "Responsável ONG",
    cnpj: generateValidCnpj(ts),
    address: "Rua C, 50",
    city: "Campinas",
    state: "SP",
    password,
    confirmPassword: password,
    ...overrides,
  };
}

async function main() {
  const ts = Date.now();
  console.log("=== EcoPet ONG + Global Document Uniqueness Tests ===\n");

  const health = await req("/api/health");
  assert(health.status === 200, "health 200");

  const ong = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(ongPayload(ts)),
  });
  assert(ong.status === 201, `ONG cadastro → 201 (${validationMessage(ong)})`);
  console.log("[ong] cadastro válido → 201");

  const ongCnpj = ongPayload(ts).cnpj;

  const dupOng = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      ongPayload(ts + 1, {
        email: `ong.dup.${ts}@test.ecopet.local`,
        phone: `+55119${String(ts + 1).slice(-8)}`,
        cnpj: ongCnpj,
      })
    ),
  });
  assertDuplicateResponse(dupOng, "CNPJ_DUPLICATE");
  console.log("[ong] CNPJ duplicado → 409 + mensagem genérica");

  const checkCnpj = await req(`/api/auth/check-document?type=cnpj&value=${ongCnpj}`);
  assert(checkCnpj.status === 200, "check-document CNPJ → 200");
  assert(checkCnpj.data.data?.available === false, "CNPJ já cadastrado → unavailable");
  console.log("[check-document] CNPJ em uso → unavailable");

  const sharedCpf = generateValidCpf(ts + 100);
  const client = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(clientPayload(ts + 100, { cpf: sharedCpf })),
  });
  assert(client.status === 201, `cliente com CPF → 201 (${validationMessage(client)})`);
  console.log("[client] cadastro com CPF → 201");

  const partnerDupCpf = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      autonomousPartnerPayload(ts + 101, {
        cpf: sharedCpf,
        email: `dup.cpf.${ts}@test.ecopet.local`,
        username: `dcp${String(ts + 101).slice(-8)}`,
        phone: `+55119${String(ts + 101).slice(-8)}`,
      })
    ),
  });
  assertDuplicateResponse(partnerDupCpf, "CPF_DUPLICATE");
  console.log("[global] CPF duplicado cliente → parceiro → 409 + mensagem genérica");

  const checkCpf = await req(`/api/auth/check-document?type=cpf&value=${sharedCpf}`);
  assert(checkCpf.status === 200, "check-document CPF → 200");
  assert(checkCpf.data.data?.available === false, "CPF em uso → unavailable");
  console.log("[check-document] CPF em uso → unavailable");

  const partnerCpf = generateValidCpf(ts + 200);
  const partnerFirst = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      autonomousPartnerPayload(ts + 200, {
        cpf: partnerCpf,
        email: `pf.${ts}@test.ecopet.local`,
        username: `pfc${String(ts + 200).slice(-8)}`,
        phone: `+55119${String(ts + 200).slice(-8)}`,
      })
    ),
  });
  assert(partnerFirst.status === 201, "parceiro autônomo → 201");
  const clientDupCpf = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientPayload(ts + 201, {
        cpf: partnerCpf,
        email: `cdp.${ts}@test.ecopet.local`,
        username: `cdp${String(ts + 201).slice(-8)}`,
        phone: `+55119${String(ts + 201).slice(-8)}`,
      })
    ),
  });
  assertDuplicateResponse(clientDupCpf, "CPF_DUPLICATE");
  console.log("[global] CPF duplicado parceiro → cliente → 409 + mensagem genérica");

  const corpCnpj = generateValidCnpj(ts + 300);
  const corpPartner = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "PARTNER",
      partnerType: "CORPORATE",
      name: "Resp Corp",
      email: `corp.${ts}@test.ecopet.local`,
      phone: `+55119${String(ts + 300).slice(-8)}`,
      username: `crp${String(ts + 300).slice(-8)}`,
      activityStartDate: "2018-03-15",
      activityAreas: ["SAUDE_ANIMAL"],
      businessDescription:
        "Atuo há anos com cuidados veterinários e estética pet, oferecendo banho, tosa e consultas preventivas com foco no bem-estar animal e atendimento humanizado.",
      addressDetails: {
        zipCode: "01310-100",
        streetType: "Avenida",
        street: "Paulista",
        number: "1000",
        district: "Bela Vista",
        city: "São Paulo",
        state: "SP",
      },
      operationDetails: { modes: ["BY_APPOINTMENT"], serviceRadius: "KM_10", deliveryOptions: [] },
      financialDetails: { paymentMethods: ["Pix"], pixKeyType: "E-mail", pixKey: `corp.${ts}@test.ecopet.local` },
      cnpj: corpCnpj,
      businessName: "Corp Pet",
      legalName: "Corp Pet LTDA",
      corporateType: "MEI",
      password,
      confirmPassword: password,
      acceptTerms: true,
      acceptPrivacy: true,
      providedDocumentTypes: ["LEGAL_REP_ID", "RESIDENCE_PROOF", "CNPJ_CARD", "SOCIAL_CONTRACT"],
    }),
  });
  assert(corpPartner.status === 201, "parceiro corporativo → 201");
  const ongDupCnpj = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      ongPayload(ts + 301, {
        cnpj: corpCnpj,
        email: `ong.cnpj.${ts}@test.ecopet.local`,
        phone: `+55119${String(ts + 301).slice(-8)}`,
      })
    ),
  });
  assertDuplicateResponse(ongDupCnpj, "CNPJ_DUPLICATE");
  console.log("[global] CNPJ duplicado parceiro → ONG → 409 + mensagem genérica");

  // E-mail duplicado entre personas
  const sharedEmail = `shared.mail.${ts}@test.ecopet.local`;
  const clientEmail = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      clientPayload(ts + 400, {
        email: sharedEmail,
        username: `cem${String(ts + 400).slice(-8)}`,
        phone: `+55119${String(ts + 400).slice(-8)}`,
      })
    ),
  });
  assert(clientEmail.status === 201, "cliente e-mail base → 201");
  const partnerDupEmail = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      autonomousPartnerPayload(ts + 401, {
        email: sharedEmail,
        username: `pem${String(ts + 401).slice(-8)}`,
        phone: `+55119${String(ts + 401).slice(-8)}`,
      })
    ),
  });
  assertDuplicateResponse(partnerDupEmail, "EMAIL_DUPLICATE");
  console.log("[global] e-mail duplicado cliente → parceiro → 409 + mensagem genérica");

  const apiErrorsSrc = readSrc("lib/api-errors.ts");
  const clientFormSrc = readSrc("components/features/foundation/client-register-form.tsx");
  const partnerFormSrc = readSrc("components/features/foundation/partner/partner-register-form.tsx");
  const registerFormSrc = readSrc("components/features/foundation/register-form.tsx");

  assert(apiErrorsSrc.includes("USER_ALREADY_REGISTERED_MESSAGE"), "api-errors mapeia mensagem genérica");
  assert(clientFormSrc.includes("duplicateRegistrationError"), "cliente usa erro genérico de duplicidade");
  assert(partnerFormSrc.includes("duplicateRegistrationError"), "parceiro usa erro genérico de duplicidade");
  assert(registerFormSrc.includes("duplicateRegistrationError"), "ONG usa erro genérico de duplicidade");
  assert(!clientFormSrc.includes("Já utilizado"), "cliente não revela campo duplicado no live feedback");
  console.log("[ui] frontend preparado para mensagem genérica → OK");

  console.log("\n✓ Todos os testes de ONG e unicidade global passaram.");
}

main().catch((e) => {
  console.error("\n✗", e.message);
  process.exit(1);
});
