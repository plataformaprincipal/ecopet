/**
 * Testes de cadastro de parceiro EcoPet — autônomo, corporativo e documentos legais.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateValidCnpj, generateValidCpf } from "./cnpj-test-utils.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WEB = process.env.WEB_URL || "http://localhost:3000";
const password = "Ecopet@Forte2026";

const DOC_LEGAL_REP = "LEGAL_REP_ID";
const DOC_RESIDENCE_PROOF = "RESIDENCE_PROOF";
const DOC_CNPJ_CARD = "CNPJ_CARD";
const DOC_SOCIAL_CONTRACT = "SOCIAL_CONTRACT";

const AUTONOMOUS_REQUIRED_DOCS = [DOC_LEGAL_REP, DOC_RESIDENCE_PROOF];
const CORPORATE_REQUIRED_DOCS = [
  DOC_LEGAL_REP,
  DOC_RESIDENCE_PROOF,
  DOC_CNPJ_CARD,
  DOC_SOCIAL_CONTRACT,
];

function readSrc(relativePath) {
  return readFileSync(join(ROOT, "apps/web/src", relativePath), "utf8");
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function generateCnpj() {
  return generateValidCnpj(Date.now());
}

function validationMessage(res) {
  const err = res.data?.error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && err.message) return err.message;
  return "";
}

async function req(path, opts = {}) {
  const res = await fetch(`${WEB}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function reqHtml(path) {
  const res = await fetch(`${WEB}${path}`);
  const text = await res.text();
  return { status: res.status, text };
}

function basePartnerPayload(ts, overrides = {}) {
  const suffix = String(ts).slice(-8);
  return {
    role: "PARTNER",
    name: "Parceiro Teste Silva",
    email: `partner.${ts}@test.ecopet.local`,
    phone: `+55119${suffix}`,
    username: `partner${suffix}`,
    activityStartDate: "2018-03-15",
    activityAreas: ["SAUDE_ANIMAL", "ESTETICA_BEM_ESTAR"],
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
      modes: ["BY_APPOINTMENT", "FIXED_HOURS"],
      weekdays: ["MON", "TUE", "WED"],
      openTime: "09:00",
      closeTime: "18:00",
      serviceRadius: "KM_10",
      deliveryOptions: ["HOME_SERVICE"],
    },
    financialDetails: {
      paymentMethods: ["Pix", "Cartão de crédito"],
      pixKeyType: "E-mail",
      pixKey: `partner.${ts}@test.ecopet.local`,
    },
    password,
    confirmPassword: password,
    acceptTerms: true,
    acceptPrivacy: true,
    providedDocumentTypes: AUTONOMOUS_REQUIRED_DOCS,
    ...overrides,
  };
}

async function main() {
  const ts = Date.now();
  console.log("=== EcoPet Partner Registration Tests ===\n");

  const health = await req("/api/health");
  assert(health.status === 200, "health 200");

  // Autônomo — CPF inválido
  const badCpf = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      basePartnerPayload(ts + 1, {
        partnerType: "AUTONOMOUS",
        cpf: "11111111111",
        professionalName: "Clínica Pet Autônomo",
      })
    ),
  });
  assert(badCpf.status === 400, "CPF inválido → 400");
  console.log("[autonomous] CPF inválido → 400");

  // Autônomo — válido
  const autoCpf = generateValidCpf(ts);
  const autoEmail = `auto.partner.${ts}@test.ecopet.local`;
  const autoUser = `autop${String(ts).slice(-8)}`;
  const autonomous = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      basePartnerPayload(ts, {
        partnerType: "AUTONOMOUS",
        email: autoEmail,
        username: autoUser,
        cpf: autoCpf,
        professionalName: "Pet Care Autônomo",
        financialDetails: {
          paymentMethods: ["Pix", "Transferência bancária"],
          pixKeyType: "CPF",
          pixKey: autoCpf,
          bankName: "Nubank",
          agency: "0001",
          accountNumber: "1234567",
          accountDigit: "8",
          accountType: "Corrente",
          accountHolder: "Parceiro Teste Silva",
          accountHolderDocument: autoCpf,
        },
      })
    ),
  });
  assert(autonomous.status === 201, `autônomo 201 — ${validationMessage(autonomous)}`);
  assert(autonomous.data.data?.user?.accountStatus === "ACTIVE", "autônomo ACTIVE");
  assert(autonomous.data.data?.redirectTo === "/dashboard/partner", "redirect partner");
  console.log("[autonomous] cadastro válido → 201 ACTIVE");

  // Autônomo — área Outros sem descrição
  const autoOther = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      basePartnerPayload(ts + 2, {
        partnerType: "AUTONOMOUS",
        email: `auto.other.${ts}@test.ecopet.local`,
        username: `aoth${String(ts + 2).slice(-8)}`,
        phone: `+55119${String(ts + 2).slice(-8)}`,
        cpf: generateValidCpf(ts + 2),
        professionalName: "Serviço Outros",
        activityAreas: ["OUTROS"],
        activityAreasOther: "",
      })
    ),
  });
  assert(autoOther.status === 400, "Outros sem descrição → 400");
  console.log("[autonomous] Outros sem descrição → 400");

  // Corporativo — CNPJ inválido
  const badCnpj = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      basePartnerPayload(ts + 3, {
        partnerType: "CORPORATE",
        cnpj: "00000000000000",
        businessName: "Pet Shop LTDA",
        legalName: "Pet Shop Comercial LTDA",
        corporateType: "MEI",
        email: `corp.bad.${ts}@test.ecopet.local`,
        username: `cbad${String(ts + 3).slice(-8)}`,
        phone: `+55119${String(ts + 3).slice(-8)}`,
        providedDocumentTypes: CORPORATE_REQUIRED_DOCS,
      })
    ),
  });
  assert(badCnpj.status === 400, "CNPJ inválido → 400");
  console.log("[corporate] CNPJ inválido → 400");

  // Corporativo — válido
  const cnpj = generateCnpj();
  const corpEmail = `corp.partner.${ts}@test.ecopet.local`;
  const corporate = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      basePartnerPayload(ts + 4, {
        partnerType: "CORPORATE",
        email: corpEmail,
        username: `corp${String(ts + 4).slice(-8)}`,
        phone: `+55119${String(ts + 4).slice(-8)}`,
        cnpj,
        businessName: "Pet Shop Amigo",
        legalName: "Pet Shop Amigo LTDA",
        corporateType: "Empresa Ltda.",
        providedDocumentTypes: CORPORATE_REQUIRED_DOCS,
      })
    ),
  });
  assert(corporate.status === 201, `corporativo 201 — ${validationMessage(corporate)}`);
  assert(corporate.data.data?.user?.accountStatus === "ACTIVE", "corporativo ACTIVE");
  console.log("[corporate] cadastro válido → 201 ACTIVE");

  // Corporativo — CNPJ duplicado
  const dupCnpj = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      basePartnerPayload(ts + 5, {
        partnerType: "CORPORATE",
        email: `corp.dup.${ts}@test.ecopet.local`,
        username: `cdup${String(ts + 5).slice(-8)}`,
        phone: `+55119${String(ts + 5).slice(-8)}`,
        cnpj,
        businessName: "Dup Shop",
        legalName: "Dup Shop LTDA",
        corporateType: "MEI",
        providedDocumentTypes: CORPORATE_REQUIRED_DOCS,
      })
    ),
  });
  assert(dupCnpj.status === 409, "CNPJ duplicado → 409");
  assert(
    validationMessage(dupCnpj) === "Usuário já cadastrado.",
    "CNPJ duplicado → mensagem genérica"
  );
  assert(dupCnpj.data?.error?.code === "CNPJ_DUPLICATE", "CNPJ duplicado → código técnico");
  console.log("[corporate] CNPJ duplicado → 409");

  // Legado (compatibilidade testes auth)
  const legacyCnpj = generateCnpj();
  const legacy = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "PARTNER",
      name: "Responsável Parceiro",
      email: `legacy.${ts}@test.ecopet.local`,
      password,
      confirmPassword: password,
      phone: `+55119${String(ts + 6).slice(-8)}`,
      businessName: "Pet Shop Teste",
      legalName: "Pet Shop Teste LTDA",
      cnpj: legacyCnpj,
      category: "Pet Shop",
      address: "Rua A, 100",
      city: "São Paulo",
      state: "SP",
    }),
  });
  assert(legacy.status === 201, "legacy partner 201");
  console.log("[legacy] cadastro simplificado → 201");

  // CPF — consulta preparada (não bloqueia)
  const cpfLookup = await req("/api/integrations/cpf", {
    method: "POST",
    body: JSON.stringify({ cpf: generateValidCpf(ts + 10), name: "Parceiro Teste Silva" }),
  });
  assert(cpfLookup.status === 200, "CPF sync API → 200");
  assert(cpfLookup.data.data?.blocksRegistration === false, "CPF sync não bloqueia");
  console.log("[cpf] sincronização preparada → OK");

  // CNPJ — consulta inválida
  const cnpjBad = await req("/api/integrations/cnpj?cnpj=00000000000000");
  assert(cnpjBad.status === 400, "CNPJ API inválido → 400");
  console.log("[cnpj] consulta inválida → 400");

  // CNPJ — consulta BrasilAPI (CNPJ público conhecido)
  const knownCnpj = "19131243000197";
  const cnpjLookup = await req(`/api/integrations/cnpj?cnpj=${knownCnpj}`);
  assert(cnpjLookup.status === 200, "CNPJ API → 200");
  if (cnpjLookup.data.data?.found) {
    assert(cnpjLookup.data.data.data?.legalName, "razão social preenchida");
    assert(cnpjLookup.data.data.data?.businessName, "nome fantasia preenchido");
    console.log("[cnpj] consulta automática → razão social e fantasia OK");
  } else {
    console.log("[cnpj] consulta automática → CNPJ não encontrado (rede/API), estrutura OK");
  }

  // Cadastro com logotipo e documentos (obrigatórios + opcionais)
  const withAssets = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      basePartnerPayload(ts + 20, {
        partnerType: "AUTONOMOUS",
        email: `assets.${ts}@test.ecopet.local`,
        username: `ast${String(ts + 20).slice(-8)}`,
        phone: `+55119${String(ts + 20).slice(-8)}`,
        cpf: generateValidCpf(ts + 20),
        professionalName: "Pet Assets",
        logoUrl: "https://cdn.example.test/partner/logo.webp",
        logoAlt: "Logotipo Pet Assets",
        providedDocumentTypes: [...AUTONOMOUS_REQUIRED_DOCS, "CPF"],
        verificationDocuments: [
          {
            id: "doc-1",
            type: DOC_LEGAL_REP,
            typeLabel: "Documento oficial do Responsável Legal",
            fileName: "rg.pdf",
            url: "https://cdn.example.test/partner/rg.pdf",
            mimeType: "application/pdf",
            sizeBytes: 1024,
            uploadedAt: new Date().toISOString(),
          },
          {
            id: "doc-2",
            type: DOC_RESIDENCE_PROOF,
            typeLabel: "Comprovante de Residência",
            fileName: "conta.jpg",
            url: "https://cdn.example.test/partner/conta.jpg",
            mimeType: "image/jpeg",
            sizeBytes: 2048,
            uploadedAt: new Date().toISOString(),
          },
          {
            id: "doc-3",
            type: "CPF",
            typeLabel: "CPF",
            fileName: "cpf.pdf",
            url: "https://cdn.example.test/partner/cpf.pdf",
            mimeType: "application/pdf",
            sizeBytes: 512,
            uploadedAt: new Date().toISOString(),
          },
        ],
      })
    ),
  });
  assert(withAssets.status === 201, `cadastro com logo/docs → 201 — ${validationMessage(withAssets)}`);
  assert(withAssets.data.data?.user?.accountStatus === "ACTIVE", "logo + docs obrigatórios ACTIVE");
  console.log("[assets] logo + documentos obrigatórios e opcionais → 201 ACTIVE");

  // Autônomo — sem documentos obrigatórios bloqueia
  const autoNoDocs = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      basePartnerPayload(ts + 21, {
        partnerType: "AUTONOMOUS",
        email: `nodocs.${ts}@test.ecopet.local`,
        username: `ndc${String(ts + 21).slice(-8)}`,
        phone: `+55119${String(ts + 21).slice(-8)}`,
        cpf: generateValidCpf(ts + 21),
        professionalName: "Sem Docs Autônomo",
        providedDocumentTypes: [],
      })
    ),
  });
  assert(autoNoDocs.status === 400, "autônomo sem docs → 400");
  console.log("[docs] autônomo sem obrigatórios → 400");

  // Corporativo — sem documentos obrigatórios bloqueia
  const corpNoDocs = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      basePartnerPayload(ts + 22, {
        partnerType: "CORPORATE",
        email: `corp.nodocs.${ts}@test.ecopet.local`,
        username: `cnd${String(ts + 22).slice(-8)}`,
        phone: `+55119${String(ts + 22).slice(-8)}`,
        cnpj: generateValidCnpj(ts + 22),
        businessName: "Sem Docs LTDA",
        legalName: "Sem Docs Comercial LTDA",
        corporateType: "MEI",
        providedDocumentTypes: [DOC_LEGAL_REP, DOC_RESIDENCE_PROOF],
      })
    ),
  });
  assert(corpNoDocs.status === 400, "corporativo sem todos docs → 400");
  console.log("[docs] corporativo sem CNPJ/contrato → 400");

  // Funcionamento — 24h não exige horários
  const op24h = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      basePartnerPayload(ts + 23, {
        partnerType: "AUTONOMOUS",
        email: `op24.${ts}@test.ecopet.local`,
        username: `o24${String(ts + 23).slice(-8)}`,
        phone: `+55119${String(ts + 23).slice(-8)}`,
        cpf: generateValidCpf(ts + 23),
        professionalName: "Pet 24h",
        operationDetails: {
          modes: ["HOURS_24"],
          serviceRadius: "KM_10",
          deliveryOptions: [],
        },
      })
    ),
  });
  assert(op24h.status === 201, `24h sem horários → 201 — ${validationMessage(op24h)}`);
  console.log("[operation] 24h sem dias/horários → 201");

  // Funcionamento — horário fixo sem dias bloqueia
  const opFixedBad = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      basePartnerPayload(ts + 24, {
        partnerType: "AUTONOMOUS",
        email: `opfix.${ts}@test.ecopet.local`,
        username: `ofx${String(ts + 24).slice(-8)}`,
        phone: `+55119${String(ts + 24).slice(-8)}`,
        cpf: generateValidCpf(ts + 24),
        professionalName: "Pet Fixo",
        operationDetails: {
          modes: ["FIXED_HOURS"],
          weekdays: [],
          openTime: "",
          closeTime: "",
          serviceRadius: "KM_10",
          deliveryOptions: [],
        },
      })
    ),
  });
  assert(opFixedBad.status === 400, "horário fixo sem dias → 400");
  console.log("[operation] horário fixo sem dias/horários → 400");

  // ── Documentos legais exclusivos do Parceiro ──
  const partnerFormSrc = readSrc("components/features/foundation/partner/partner-register-form.tsx");
  const partnerLegalSrc = readSrc("components/features/foundation/partner/partner-legal-acceptance.tsx");
  const clientFormSrc = readSrc("components/features/foundation/client-register-form.tsx");
  const clientLegalSrc = readSrc("components/features/foundation/client-legal-acceptance.tsx");
  const registerFormSrc = readSrc("components/features/foundation/register-form.tsx");
  const legalLinksSrc = readSrc("lib/legal/legal-links.ts");
  const partnerTermsContent = readSrc("lib/legal/partner-terms-content.ts");
  const clientTermsContent = readSrc("lib/legal/client-terms-content.ts");

  assert(partnerFormSrc.includes("PartnerLegalAcceptance"), "parceiro usa aceite legal do parceiro");
  assert(partnerLegalSrc.includes('"/legal/parceiro/termos"') || partnerLegalSrc.includes("PARTNER_LEGAL"), "parceiro link termos parceiro");
  assert(partnerLegalSrc.includes("Pré-visualizar"), "parceiro tem pré-visualização legal");
  assert(!partnerLegalSrc.includes("CLIENT_LEGAL"), "aceite parceiro não usa CLIENT_LEGAL");
  assert(!partnerFormSrc.includes("/legal/cliente/termos"), "form parceiro não exibe termos cliente");
  assert(clientFormSrc.includes("ClientLegalAcceptance"), "cliente usa aceite legal do cliente");
  assert(!clientLegalSrc.includes("/legal/parceiro/termos"), "aceite cliente não exibe termos parceiro");
  assert(!clientFormSrc.includes("PARTNER_LEGAL"), "cadastro cliente não referencia PARTNER_LEGAL");
  assert(!registerFormSrc.includes("/legal/parceiro/termos"), "form ONG/legado não exibe termos parceiro");
  assert(legalLinksSrc.includes("ONG_LEGAL"), "estrutura ONG preparada");
  assert(partnerTermsContent.includes("Termos de Uso e de Parceria do Parceiro EcoPet"), "título termos parceiro");
  assert(!partnerTermsContent.includes("tutores ou responsáveis"), "termos parceiro não reutilizam texto cliente");
  assert(clientTermsContent.includes("Clientes (tutores"), "termos cliente permanecem separados");
  assert(
    legalLinksSrc.includes("Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar."),
    "mensagem aceite parceiro"
  );
  console.log("[legal] segregação parceiro/cliente/ONG → OK");

  const partnerTermsPage = await reqHtml("/legal/parceiro/termos");
  assert(partnerTermsPage.status === 200, "página termos parceiro carrega");
  assert(partnerTermsPage.text.includes("Parceiro EcoPet"), "termos parceiro identificados");
  assert(partnerTermsPage.text.includes("Objeto da parceria"), "conteúdo termos parceiro");
  const partnerPrivacyPage = await reqHtml("/legal/parceiro/privacidade");
  assert(partnerPrivacyPage.status === 200, "página privacidade parceiro carrega");
  assert(partnerPrivacyPage.text.includes("Política de Privacidade do Parceiro EcoPet") || partnerPrivacyPage.text.includes("Parceiro EcoPet"), "conteúdo privacidade parceiro");
  assert(partnerPrivacyPage.text.includes("LGPD"), "privacidade parceiro menciona LGPD");
  console.log("[legal] páginas /legal/parceiro/* → 200");

  const noAccept = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(
      basePartnerPayload(ts + 30, {
        partnerType: "AUTONOMOUS",
        email: `noaccept.${ts}@test.ecopet.local`,
        username: `nacc${String(ts + 30).slice(-8)}`,
        phone: `+55119${String(ts + 30).slice(-8)}`,
        cpf: generateValidCpf(ts + 30),
        professionalName: "Sem Aceite",
        acceptTerms: false,
        acceptPrivacy: false,
      })
    ),
  });
  assert(noAccept.status === 400, "cadastro sem aceite → 400");
  console.log("[legal] cadastro bloqueado sem aceite → 400");

  console.log("\n✓ Todos os testes de parceiro passaram.");
}

main().catch((e) => {
  console.error("\n✗", e.message);
  process.exit(1);
});
