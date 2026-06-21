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

function individualOngPayload(ts, overrides = {}) {
  const suffix = String(ts).slice(-8);
  return {
    role: "ONG",
    ongType: "INDIVIDUAL",
    name: "Protetor Teste Silva",
    cpf: generateValidCpf(ts),
    email: `prot.${ts}@test.ecopet.local`,
    phone: `+55119${suffix}`,
    username: `prt${suffix}`,
    activityStartDate: "2019-06-01",
    actionTypes: ["RESCUE", "ADOPTION"],
    description:
      "Atuo há anos resgatando animais abandonados e promovendo adoções responsáveis na minha região com foco em bem-estar animal.",
    city: "São Paulo",
    state: "SP",
    password,
    confirmPassword: password,
    acceptTerms: true,
    acceptPrivacy: true,
    providedDocumentTypes: ["LEGAL_REP_ID", "CPF_DOC", "RESIDENCE_PROOF"],
    ...overrides,
  };
}

function institutionOngPayload(ts, overrides = {}) {
  const suffix = String(ts).slice(-8);
  return {
    role: "ONG",
    ongType: "INSTITUTION",
    name: "Representante ONG Silva",
    cpf: generateValidCpf(ts + 50),
    email: `inst.${ts}@test.ecopet.local`,
    phone: `+55119${suffix}`,
    username: `ong${suffix}`,
    cnpj: generateValidCnpj(ts),
    ongName: "Instituto Pets",
    legalName: "Instituto Pets Proteção LTDA",
    foundedDate: "2015-01-15",
    focusArea: "Proteção Animal",
    representativeRole: "Presidente",
    actionTypes: ["RESCUE", "SHELTER"],
    description:
      "Instituto dedicado ao resgate, acolhimento e adoção de animais em situação de vulnerabilidade com transparência e impacto social.",
    city: "Campinas",
    state: "SP",
    password,
    confirmPassword: password,
    acceptTerms: true,
    acceptPrivacy: true,
    providedDocumentTypes: ["LEGAL_REP_ID", "RESIDENCE_PROOF", "CNPJ_CARD", "SOCIAL_STATUTE"],
    profileDetails: {
      mission: "Proteger e reabilitar animais abandonados.",
      vision: "Ser referência em proteção animal na região.",
    },
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
  assert(ong.status === 201, `ONG legado cadastro → 201 (${validationMessage(ong)})`);
  console.log("[ong] cadastro legado CNPJ → 201");

  const individual = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(individualOngPayload(ts + 10)),
  });
  assert(individual.status === 201, `protetor individual → 201 (${validationMessage(individual)})`);
  console.log("[ong] protetor individual (CPF) → 201");

  const individualCpf = individualOngPayload(ts + 10).cpf;
  const dupIndividualCpf = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      individualOngPayload(ts + 11, {
        cpf: individualCpf,
        email: `prot.dup.${ts}@test.ecopet.local`,
        username: `prtd${String(ts + 11).slice(-8)}`,
        phone: `+55119${String(ts + 11).slice(-8)}`,
      })
    ),
  });
  assertDuplicateResponse(dupIndividualCpf, "CPF_DUPLICATE");
  console.log("[ong] CPF duplicado protetor → 409 + mensagem genérica");

  const institution = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(institutionOngPayload(ts + 20)),
  });
  assert(institution.status === 201, `ONG institucional → 201 (${validationMessage(institution)})`);
  console.log("[ong] ONG institucional (CNPJ) → 201");

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
  const ongFormSrc = readSrc("components/features/foundation/ong/ong-register-form.tsx");
  const ongTypeSrc = readSrc("components/features/foundation/ong/ong-type-selector.tsx");
  const ongLegalSrc = readSrc("components/features/foundation/ong/ong-legal-acceptance.tsx");
  const legalLinksSrc = readSrc("lib/legal/legal-links.ts");
  const ongTermsSrc = readSrc("lib/legal/ong-terms-content.ts");
  const ongPrivacySrc = readSrc("lib/legal/ong-privacy-content.ts");

  assert(apiErrorsSrc.includes("USER_ALREADY_REGISTERED_MESSAGE"), "api-errors mapeia mensagem genérica");
  assert(clientFormSrc.includes("duplicateRegistrationError"), "cliente usa erro genérico de duplicidade");
  assert(partnerFormSrc.includes("duplicateRegistrationError"), "parceiro usa erro genérico de duplicidade");
  assert(ongFormSrc.includes("duplicateRegistrationError"), "ONG usa erro genérico de duplicidade");
  assert(ongTypeSrc.includes("Como você atua na proteção animal?"), "etapa 0 tipo de cadastro ONG");
  assert(ongFormSrc.includes("OngDocumentationStep"), "etapa documentação ONG");
  assert(ongFormSrc.includes("OngLegalAcceptance"), "etapa termos ONG");
  assert(ongLegalSrc.includes("ONG_LEGAL"), "componente usa links exclusivos ONG");
  assert(legalLinksSrc.includes("Aceito os Termos de Uso e de Colaboração da ONG EcoPet"), "checkbox termos ONG");
  assert(legalLinksSrc.includes("Aceito a Política de Privacidade da ONG EcoPet"), "checkbox privacidade ONG");
  assert(legalLinksSrc.includes("/legal/ong/termos"), "href termos ONG");
  assert(legalLinksSrc.includes("/legal/ong/privacidade"), "href privacidade ONG");
  assert(ongLegalSrc.includes("ONG_LEGAL_ACCEPTANCE_MESSAGE"), "componente usa mensagem aceite ONG");
  assert(legalLinksSrc.includes("Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar."), "mensagem aceite ONG");
  assert(legalLinksSrc.includes("Termos de Uso e de Colaboração da ONG EcoPet"), "título termos ONG em legal-links");
  assert(ongTermsSrc.includes("Adoção responsável"), "termos ONG cobrem adoção responsável");
  assert(ongTermsSrc.includes("Campanhas de arrecadação"), "termos ONG cobrem arrecadação");
  assert(ongPrivacySrc.includes("CPF"), "privacidade ONG cobre CPF");
  assert(ongPrivacySrc.includes("CNPJ"), "privacidade ONG cobre CNPJ");
  assert(ongPrivacySrc.includes("LGPD"), "privacidade ONG menciona LGPD");
  assert(!clientFormSrc.includes("Já utilizado"), "cliente não revela campo duplicado no live feedback");
  assert(!ongLegalSrc.includes("Parceiro EcoPet"), "ONG não exibe documentos do parceiro");
  console.log("[ui] documentos legais ONG completos + integração cadastro → OK");

  console.log("\n✓ Todos os testes de ONG e unicidade global passaram.");
}

main().catch((e) => {
  console.error("\n✗", e.message);
  process.exit(1);
});
