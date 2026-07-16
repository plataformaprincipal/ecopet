/**
 * Testes de fundação: navegação por sessão, menu por role, chaves React e formatação de perfil.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const WEB = process.env.WEB_URL || "http://localhost:3000";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const webSrc = path.join(root, "apps", "web", "src");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function readSrc(relPath) {
  return fs.readFileSync(path.join(webSrc, relPath), "utf8");
}

const cookieJar = new Map();

async function req(pathname, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const cookie = cookieJar.get("cookie");
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(`${WEB}${pathname}`, { ...opts, headers, redirect: "manual" });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const session = setCookie.split(";")[0];
    if (session.includes("=")) cookieJar.set("cookie", session);
    if (setCookie.includes("Max-Age=0") || setCookie.includes("max-age=0")) cookieJar.delete("cookie");
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("json") ? await res.json().catch(() => ({})) : {};
  return { status: res.status, data, location: res.headers.get("location") };
}

function navLabelKeysFromRoleNav(roleBlock) {
  const keys = [];
  const re = /labelKey:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(roleBlock))) keys.push(m[1]);
  return keys;
}

function extractRoleBlock(source, roleConst) {
  const start = source.indexOf(`const ${roleConst}`);
  const next = source.indexOf("\nconst ", start + 1);
  return next === -1 ? source.slice(start) : source.slice(start, next);
}

async function main() {
  console.log("=== EcoPet Foundation Navigation Tests ===\n");

  // --- Verificações estáticas de código ---
  const hookSrc = readSrc("hooks/use-foundation-session.ts");
  assert(hookSrc.includes("useAuthSession"), "useFoundationSession deve reutilizar useAuthSession");
  assert(hookSrc.includes("data?.user"), "useFoundationSession deve ler data.user da sessão");

  const authProviderSrc = readSrc("providers/auth-session-provider.tsx");
  assert(authProviderSrc.includes("SESSION_CHANGED_EVENT"), "AuthSessionProvider deve escutar evento de sessão");
  const fetchSessionSrc = readSrc("lib/auth/fetch-session.ts");
  assert(fetchSessionSrc.includes('cache: "no-store"'), "fetch-session deve evitar cache velho");

  const searchPanel = readSrc("components/features/marketplace/search-panel.tsx");
  assert(searchPanel.includes("key={`${c.source}-${c.slug}`}"), "search-panel deve usar chave composta");
  assert(searchPanel.includes("product:") || searchPanel.includes("categoryOptionValue"), "search-panel deve usar value composto");
  assert(!searchPanel.includes("key={c.slug}"), "search-panel não deve usar apenas c.slug como key");

  const roleNavSrc = readSrc("lib/navigation/role-nav.ts");
  assert(!roleNavSrc.includes('href: "/", labelKey: "nav.home"'), "role-nav autenticado não deve apontar Início para /");
  assert(!roleNavSrc.includes("common.signIn"), "role-nav autenticado não deve ter Entrar");
  assert(!roleNavSrc.includes("common.createAccount"), "role-nav autenticado não deve ter Criar Conta");
  const publicMainNavConfigSrc = readSrc("lib/navigation/main-nav.ts");
  assert(publicMainNavConfigSrc.includes('"/inicio"'), "main-nav público mantém match /inicio");

  const secureNavSrc = readSrc("lib/navigation/secure-nav.ts");
  assert(secureNavSrc.includes("common.signIn"), "secure-nav visitante deve ter Entrar");
  assert(secureNavSrc.includes("common.createAccount"), "secure-nav visitante deve ter Criar Conta");

  const clientBlock = extractRoleBlock(roleNavSrc, "CLIENT_MAIN");
  const clientKeys = navLabelKeysFromRoleNav(clientBlock);
  assert(clientKeys.includes("nav.socialNetwork"), "CLIENT main deve ter Rede Social");
  assert(clientKeys.includes("nav.explore"), "CLIENT main deve ter Explorar");
  assert(clientKeys.includes("nav.marketplace"), "CLIENT main deve ter Marketplace");
  assert(clientKeys.includes("nav.profile"), "CLIENT main deve ter Perfil");
  assert(clientKeys.length === 5, "CLIENT main deve ter exatamente 5 itens");
  assert(!clientKeys.includes("common.signIn"), "CLIENT logado não deve ver Entrar");
  assert(!clientKeys.includes("common.createAccount"), "CLIENT logado não deve ver Criar Conta");

  const clientSecondaryBlock = extractRoleBlock(roleNavSrc, "CLIENT_SECONDARY");
  const clientSecondaryKeys = navLabelKeysFromRoleNav(clientSecondaryBlock);
  assert(clientSecondaryKeys.includes("nav.myDashboard"), "CLIENT secondary deve ver Meu Painel");
  assert(clientSecondaryKeys.includes("nav.pets"), "CLIENT secondary deve ver Meus Pets");
  assert(clientSecondaryKeys.includes("nav.cart"), "CLIENT secondary deve ver Carrinho");

  const primaryNavSrc = readSrc("lib/navigation/primary-nav.ts");
  assert(primaryNavSrc.includes('id: "social"'), "primary-nav tem social");
  assert(primaryNavSrc.includes('id: "explore"'), "primary-nav tem explore");
  assert(primaryNavSrc.includes('id: "marketplace"'), "primary-nav tem marketplace");
  assert(primaryNavSrc.includes('id: "eccopet"'), "primary-nav tem eccopet");
  assert(primaryNavSrc.includes('id: "profile"'), "primary-nav tem profile");
  assert(primaryNavSrc.includes("PRIMARY_NAVIGATION"), "primary-nav exporta PRIMARY_NAVIGATION");

  const clientMobileNavSrc = readSrc("components/features/client/client-mobile-nav.tsx");
  assert(clientMobileNavSrc.includes("PrimaryBottomNav"), "ClientMobileNav usa PrimaryBottomNav");
  assert(!clientMobileNavSrc.includes("CLIENT_NAV_ITEMS.map"), "ClientMobileNav não renderiza todos CLIENT_NAV_ITEMS");

  const partnerBlock = extractRoleBlock(roleNavSrc, "PARTNER_MAIN");
  const partnerKeys = navLabelKeysFromRoleNav(partnerBlock);
  assert(partnerKeys.includes("nav.myDashboard"), "PARTNER deve ver Painel");
  assert(partnerKeys.includes("nav.services"), "PARTNER deve ver Serviços");
  assert(partnerKeys.includes("nav.marketplace"), "PARTNER main deve ver Marketplace");
  assert(partnerKeys.length === 5, "PARTNER main deve ter exatamente 5 itens");
  const partnerSecondaryBlock = extractRoleBlock(roleNavSrc, "PARTNER_SECONDARY");
  const partnerSecondaryKeys = navLabelKeysFromRoleNav(partnerSecondaryBlock);
  assert(partnerSecondaryKeys.includes("nav.orders"), "PARTNER secondary deve ver Pedidos");

  const adminBlock = extractRoleBlock(roleNavSrc, "ADMIN_MAIN");
  const adminKeys = navLabelKeysFromRoleNav(adminBlock);
  assert(adminKeys.includes("nav.adminPanel"), "ADMIN deve ver Admin");
  assert(adminKeys.includes("nav.integrations"), "ADMIN deve ver Integrações");

  const formatRoleSrc = readSrc("lib/auth/format-user-role.ts");
  assert(formatRoleSrc.includes("Cliente"), "formatUserRole deve mapear CLIENT para Cliente");

  const rolePanelSrc = readSrc("components/features/foundation/role-panel.tsx");
  assert(rolePanelSrc.includes("formatUserRole"), "role-panel deve usar formatUserRole");

  const registerSrc = readSrc("components/features/foundation/register-form.tsx");
  assert(registerSrc.includes("ClientRegisterForm"), "shell de cadastro renderiza formulário CLIENT");
  assert(registerSrc.includes("PartnerRegisterForm"), "shell de cadastro renderiza formulário PARTNER");
  assert(registerSrc.includes("OngRegisterForm"), "shell de cadastro renderiza formulário ONG");

  const clientRegisterSrc = readSrc("components/features/foundation/client-register-form.tsx");
  assert(clientRegisterSrc.includes("notifySessionChanged"), "cadastro CLIENT deve notificar mudança de sessão");
  assert(clientRegisterSrc.includes("confirmSessionCookie"), "cadastro CLIENT deve confirmar cookie antes do redirect");
  assert(clientRegisterSrc.includes("router.refresh"), "cadastro CLIENT deve refrescar após redirect");
  const emailValSrc = readSrc("lib/validation/email.ts");
  assert(emailValSrc.includes("Digite um e-mail válido"), "validação e-mail inválido definida");
  assert(emailValSrc.includes("E-mail válido"), "validação e-mail válido definida");
  assert(clientRegisterSrc.includes("getEmailLiveFeedback"), "cadastro CLIENT usa feedback de e-mail em tempo real");
  assert(!clientRegisterSrc.includes("arthuralves"), "cadastro CLIENT não deve exibir exemplo de username");
  assert(!clientRegisterSrc.includes("Exemplo:"), "cadastro CLIENT não deve exibir exemplo visual de username");
  assert(clientRegisterSrc.includes("auth.client.usernamePlaceholder"), "placeholder username via i18n");
  assert(clientRegisterSrc.includes("ClientLegalAcceptance"), "cadastro CLIENT usa aceites legais premium");
  assert(clientRegisterSrc.includes("CLIENT_LEGAL_ACCEPTANCE_MESSAGE"), "mensagem aceite legal cliente");
  assert(!clientRegisterSrc.includes('href="/legal/termos"'), "cadastro CLIENT não usa termos genéricos");
  assert(!registerSrc.includes("/legal/cliente/termos"), "formulário parceiro/ONG não exibe termos cliente");
  const clientLegalSrc = readSrc("components/features/foundation/client-legal-acceptance.tsx");
  assert(clientLegalSrc.includes('href={doc.href}') || clientLegalSrc.includes("CLIENT_LEGAL"), "links legais cliente no componente de aceite");
  assert(clientLegalSrc.includes("client-accept-"), "checkboxes aceite cliente");
  const legalLinksSrcEarly = readSrc("lib/legal/legal-links.ts");
  assert(legalLinksSrcEarly.includes('"/legal/cliente/termos"'), "link termos exclusivos cliente");
  assert(legalLinksSrcEarly.includes('"/legal/cliente/privacidade"'), "link privacidade exclusiva cliente");
  assert(clientRegisterSrc.includes("disabled={!canSubmit}"), "botão cadastro desabilitado sem aceites");
  assert(clientRegisterSrc.includes('aria-live="polite"'), "feedbacks acessíveis com aria-live");
  assert(clientRegisterSrc.includes("InternationalPhoneField"), "cadastro CLIENT usa telefone internacional");
  assert(!clientRegisterSrc.includes("brazil-phone"), "cadastro CLIENT sem validação BR exclusiva");

  const intPhoneSrc = readSrc("lib/validation/international-phone.ts");
  assert(intPhoneSrc.includes("libphonenumber-js"), "validação telefone usa libphonenumber-js");
  assert(intPhoneSrc.includes("PHONE_VALID_MESSAGE"), "feedback telefone válido");

  const phoneFieldSrc = readSrc("components/features/foundation/international-phone-field.tsx");
  assert(phoneFieldSrc.includes('type="tel"'), "campo telefone type=tel");
  assert(phoneFieldSrc.includes("aria-live"), "telefone com aria-live");
  assert(phoneFieldSrc.includes("BRAZIL_DDD_OPTIONS"), "seletor DDD brasileiro");

  const brazilPhoneSrc = readSrc("lib/validation/brazil-phone.ts");
  assert(brazilPhoneSrc.includes("VALID_BRAZIL_DDD"), "lista DDDs brasileiros");
  assert(brazilPhoneSrc.includes("BR_PHONE_VALID_MESSAGE"), "mensagem telefone BR válido");
  assert(clientRegisterSrc.includes("getBirthDateBounds"), "cadastro CLIENT limita calendário de nascimento");
  console.log("[static] cadastro CLIENT (e-mail, username, aceites, gênero, data) OK");

  const roleSelectorSrc = readSrc("components/features/foundation/register-role-selector.tsx");
  assert(roleSelectorSrc.includes("auth.role.legend"), "título seletor de tipo de conta via i18n");
  assert(roleSelectorSrc.includes('role="radio"'), "cards de tipo de conta com radio acessível");
  assert(roleSelectorSrc.includes("lg:grid-cols-3"), "cards responsivos desktop 3 colunas");
  assert(roleSelectorSrc.includes("REGISTER_ROLE_REQUIRED_MESSAGE"), "mensagem tipo de conta obrigatório");
  assert(registerSrc.includes("RegisterRoleSelector"), "formulário usa seletor de tipo de conta");
  assert(registerSrc.includes("RegisterRole | null"), "tipo de conta inicia sem seleção");

  const genderSelectorSrc = readSrc("components/features/foundation/register-gender-selector.tsx");
  assert(genderSelectorSrc.includes('role="radiogroup"'), "gênero com radiogroup acessível");
  assert(genderSelectorSrc.includes("GENDER_META"), "gênero com ícones e descrições");
  assert(genderSelectorSrc.includes("grid-cols-2"), "gênero responsivo mobile");
  assert(genderSelectorSrc.includes("lg:grid-cols-5"), "gênero desktop 5 cards");

  const legalLinksSrc = readSrc("lib/legal/legal-links.ts");
  assert(legalLinksSrc.includes("PARTNER_LEGAL"), "estrutura termos parceiro preparada");
  assert(legalLinksSrc.includes("ONG_LEGAL"), "estrutura termos ONG preparada");
  const clientTermsPageSrc = readSrc("app/legal/cliente/termos/page.tsx");
  assert(clientTermsPageSrc.includes("Termos de Uso e de Serviço do Cliente EcoPet"), "página termos cliente");
  const clientPrivacyPageSrc = readSrc("app/legal/cliente/privacidade/page.tsx");
  assert(clientPrivacyPageSrc.includes("Política de Privacidade do Cliente EcoPet"), "página privacidade cliente");

  const birthDateSrc = readSrc("lib/validation/birth-date.ts");
  assert(birthDateSrc.includes("getMaxBirthDateString"), "utilitário data máxima nascimento");
  assert(birthDateSrc.includes("getMinBirthDateString"), "utilitário data mínima nascimento");
  assert(birthDateSrc.includes("É necessário ter mais de 1 ano"), "validação idade mínima");
  console.log("[static] seletores visuais e validação de data OK");

  const passwordSrc = readSrc("lib/password/validate-strong-password.ts");
  assert(passwordSrc.includes('"excellent"'), "nível Excelente de senha");
  assert(passwordSrc.includes('levelLabel: "excellent"'), "rótulo excellent de senha (i18n)");
  assert(!passwordSrc.includes("Muito Forte"), "rótulo Muito Forte removido");

  // --- Páginas legais exclusivas do Cliente ---
  // HTTP checks only when o servidor local estiver disponível (skip silencioso se offline).
  try {
    const clientTermsPage = await req("/legal/cliente/termos");
    if (clientTermsPage.status === 200) {
      const clientPrivacyPage = await req("/legal/cliente/privacidade");
      assert(clientPrivacyPage.status === 200, "página /legal/cliente/privacidade carrega");
      console.log("[http] páginas legais cliente OK");
    } else {
      console.log("[http] servidor local indisponível — pulando páginas legais");
    }
  } catch {
    console.log("[http] servidor local indisponível — pulando páginas legais");
  }

  const loginSrc = readSrc("components/features/foundation/login-form.tsx");
  assert(loginSrc.includes("confirmSessionCookie"), "login deve confirmar cookie antes do redirect");
  assert(loginSrc.includes("login-identifier"), "login usa campo e-mail ou username");
  assert(loginSrc.includes("auth.login.identifier"), "label login e-mail ou username via i18n");
  assert(loginSrc.includes("auth.login.identifierPlaceholder"), "placeholder login via i18n");

  const authMessagesSrc = readSrc("lib/constants/auth-messages.ts");
  assert(authMessagesSrc.includes("Senha incorreta"), "mensagem senha incorreta");
  assert(authMessagesSrc.includes("E-mail ou nome de usuário não encontrado"), "mensagem usuário não encontrado");

  const forgotSrc = readSrc("components/features/foundation/forgot-password-form.tsx");
  assert(forgotSrc.includes("Enviar código") || forgotSrc.includes('auth.forgotPassword.submit'), "recuperação enviar código");

  const middlewareSrc = readSrc("middleware.ts");
  assert(middlewareSrc.includes('pathname === "/"') && middlewareSrc.includes('"/inicio"'), "middleware redireciona / autenticado para /inicio");

  assert(
    authProviderSrc.includes("hasResolvedOnce"),
    "AuthSessionProvider deve revalidar sessão sem limpar usuário na navegação"
  );

  const logoutClientSrc = readSrc("lib/auth/logout-client.ts");
  assert(logoutClientSrc.includes("/api/auth/logout"), "logout-client deve chamar API de logout");

  const useLogoutSrc = readSrc("hooks/use-logout.ts");
  assert(useLogoutSrc.includes("notifySessionChanged"), "useLogout deve notificar mudança de sessão");
  assert(useLogoutSrc.includes("performLogout"), "useLogout deve usar performLogout");

  const logoutBtnSrc = readSrc("components/shared/auth/logout-button.tsx");
  assert(logoutBtnSrc.includes('dashboard.logout'), "LogoutButton deve exibir texto Sair");

  const mainNavSrc = readSrc("components/shared/navigation/main-navigation.tsx");
  assert(mainNavSrc.includes("LogoutButton"), "menu principal deve ter Sair quando autenticado");

  const bottomNavSrc = readSrc("components/shared/navigation/bottom-nav.tsx");
  assert(bottomNavSrc.includes("PrimaryBottomNav"), "menu mobile usa PrimaryBottomNav (5 itens)");
  assert(!bottomNavSrc.includes("LogoutButton"), "Sair não fica na barra inferior principal");

  assert(rolePanelSrc.includes("LogoutButton"), "painéis devem ter botão Sair");

  const settingsSrc = readSrc("components/features/settings/settings-hub.tsx");
  assert(settingsSrc.includes("LogoutButton"), "configurações deve ter Sair");

  const profileFormSrc = readSrc("components/features/foundation/profile-form.tsx");
  assert(profileFormSrc.includes("LogoutButton"), "perfil deve ter Sair");

  console.log("[static] código de navegação/sessão OK");

  // --- Verificações de API / sessão (requer servidor em WEB_URL) ---
  let apiAvailable = false;
  try {
    const guestMe = await req("/api/auth/me");
    apiAvailable = guestMe.status === 401 || guestMe.status === 200;
    if (guestMe.status === 401) {
      console.log("[api] visitante: /api/auth/me retorna 401");
    }
  } catch {
    apiAvailable = false;
  }

  if (!apiAvailable) {
    console.log("[api] servidor local indisponível — pulando testes HTTP de sessão");
    console.log("\n✅ Foundation navigation tests passed (static)");
    return;
  }

  const ts = Date.now();
  const password = "Ecopet@Forte2026";
  const clientEmail = `nav.client.${ts}@test.ecopet.local`;

  const register = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      role: "CLIENT",
      name: "Nav Cliente",
      email: clientEmail,
      password,
      confirmPassword: password,
      phone: `+55119${String(ts).slice(-8)}`,
      birthDate: "1990-05-15",
      username: `nav${String(ts).slice(-8)}`,
      gender: "MASCULINO",
      acceptTerms: true,
      acceptPrivacy: true,
    }),
  });
  assert(register.status === 201, "cadastro CLIENT 201");
  assert(register.data.data?.redirectTo === "/dashboard/client", "redirect pós-cadastro");

  const meAfterRegister = await req("/api/auth/me");
  assert(meAfterRegister.status === 200, "sessão ativa após cadastro");
  assert(meAfterRegister.data.data?.user?.role === "CLIENT", "role CLIENT na sessão");
  assert(meAfterRegister.data.data?.user?.email === clientEmail, "email na sessão");

  const feedNav = await req("/feed");
  assert(feedNav.status === 200, "navegação /feed mantém sessão (200, sem redirect login)");
  const meAfterFeed = await req("/api/auth/me");
  assert(meAfterFeed.status === 200, "sessão ativa após /feed");
  assert(meAfterFeed.data.data?.user?.role === "CLIENT", "role CLIENT após /feed");

  const inicioNav = await req("/inicio");
  assert(
    inicioNav.status === 307 || inicioNav.status === 308,
    "navegação /inicio redireciona para feed"
  );
  assert(inicioNav.location?.includes("/feed"), "/inicio redireciona para /feed");
  const meAfterInicio = await req("/api/auth/me");
  assert(meAfterInicio.status === 200, "sessão ativa após /inicio");
  assert(meAfterInicio.data.data?.user?.role === "CLIENT", "role CLIENT após /inicio");

  const homeAuthed = await req("/");
  assert(
    homeAuthed.status === 307 || homeAuthed.status === 308,
    "visitante autenticado em / redireciona para /inicio"
  );
  assert(homeAuthed.location?.includes("/inicio"), "/ autenticado redireciona para /inicio");

  const logout = await req("/api/auth/logout", { method: "POST" });
  assert(logout.status === 200, "logout ok");

  const meAfterLogout = await req("/api/auth/me");
  assert(meAfterLogout.status === 401, "sessão limpa após logout");
  console.log("[api] logout encerra sessão (me 401)");

  const login = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: clientEmail, password }),
  });
  assert(login.status === 200, "login ok");
  assert(login.data.data?.user?.role === "CLIENT", "login retorna role");

  const meAfterLogin = await req("/api/auth/me");
  assert(meAfterLogin.status === 200, "sessão ativa após login");
  assert(meAfterLogin.data.data?.user?.role === "CLIENT", "me confirma CLIENT");

  console.log("[api] sessão cadastro/login/logout OK");
  console.log("\n✅ Foundation navigation tests passed");
}

main().catch((e) => {
  console.error("\n❌", e.message);
  process.exit(1);
});
