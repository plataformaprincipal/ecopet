/**
 * Testes i18n: login/cadastro traduzidos + seletor de idioma no header.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const webSrc = path.join(root, "apps", "web", "src");
const localesDir = path.join(webSrc, "i18n", "locales");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function readSrc(relPath) {
  return fs.readFileSync(path.join(webSrc, relPath), "utf8");
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(localesDir, relPath), "utf8"));
}

function flattenKeys(obj, prefix = "") {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, key));
    } else {
      keys.push(key);
    }
  }
  return keys;
}

const AUTH_UI_FILES = [
  "components/features/foundation/login-form.tsx",
  "components/features/foundation/register-form.tsx",
  "components/features/foundation/client-register-form.tsx",
  "components/features/foundation/partner/partner-register-form.tsx",
  "components/features/foundation/ong/ong-register-form.tsx",
  "components/features/foundation/forgot-password-form.tsx",
  "components/features/foundation/reset-password-form.tsx",
  "components/features/foundation/register-role-selector.tsx",
  "components/features/foundation/register-gender-selector.tsx",
  "components/features/foundation/password-field.tsx",
  "components/features/i18n/language-selector.tsx",
];

const REQUIRED_AUTH_KEYS = [
  "auth.login.pageTitle",
  "auth.login.identifier",
  "auth.login.password",
  "auth.registerFoundation.title",
  "auth.client.fullName",
  "auth.validation.emailInvalid",
  "auth.password.level.excellent",
  "auth.gender.options.MASCULINO",
  "auth.role.CLIENT.label",
  "auth.terms.client.terms",
  "auth.terms.partner.terms",
  "auth.terms.ong.terms",
  "auth.register.partner.steps.type",
  "auth.register.ong.steps.type",
  "auth.register.partner.options.partnerTypes.AUTONOMOUS",
  "auth.register.ong.options.ongTypes.INDIVIDUAL",
  "auth.forgotPassword.title",
  "auth.resetPassword.title",
  "lang.selector.label",
];

function main() {
  console.log("=== EcoPet Auth i18n Tests ===\n");

  for (const file of AUTH_UI_FILES) {
    const src = readSrc(file);
    assert(
      src.includes("useAuthMessages") ||
        src.includes("useTranslation") ||
        src.includes("usePartnerRegisterCopy") ||
        src.includes("useOngRegisterCopy"),
      `${file} deve usar i18n`
    );
  }

  const langSelector = readSrc("components/features/i18n/language-selector.tsx");
  assert(langSelector.includes("aria-expanded"), "language-selector aria-expanded");
  assert(langSelector.includes("role=\"listbox\""), "language-selector listbox acessível");
  assert(langSelector.includes("aria-selected"), "language-selector aria-selected");
  assert(langSelector.includes("Português"), "language-selector nome Português");
  assert(langSelector.includes("English"), "language-selector nome English");
  assert(langSelector.includes("Español"), "language-selector nome Español");
  assert(!langSelector.includes("🇧🇷"), "language-selector sem bandeiras");
  assert(!langSelector.includes("abbrevFor"), "language-selector sem siglas");
  assert(!langSelector.includes("<select"), "language-selector sem select HTML");
  assert(langSelector.includes("duration-200"), "language-selector animação suave");

  const esLocale = readJson("es.json");
  assert(esLocale.common.signIn === "Iniciar sesión", "es signIn traduzido");
  assert(esLocale.common.createAccount === "Crear cuenta", "es createAccount traduzido");

  for (const locale of ["pt-BR.json", "en.json", "es.json"]) {
    const data = readJson(locale);
    const keys = new Set(flattenKeys(data));
    for (const key of REQUIRED_AUTH_KEYS) {
      assert(keys.has(key), `${locale} deve conter ${key}`);
    }
    assert(data.auth.password.level.excellent, `${locale} usa Excelente`);
    assert(!JSON.stringify(data.auth.password.level).includes("Muito Forte"), `${locale} sem Muito Forte`);
  }

  const loginForm = readSrc("components/features/foundation/login-form.tsx");
  assert(!loginForm.includes("Entrar no EcoPet"), "login-form sem título hardcoded PT");
  assert(loginForm.includes('t("auth.login.pageTitle")'), "login-form usa chave i18n");

  const registerForm = readSrc("components/features/foundation/register-form.tsx");
  assert(registerForm.includes('t("auth.registerFoundation.title")'), "register-form usa i18n");

  console.log("[i18n] arquivos UI auth verificados");
  console.log("[i18n] chaves pt-BR / en / es presentes");
  console.log("[i18n] seletor premium sem select HTML");
  console.log("\n=== Auth i18n OK ===");
}

main();
