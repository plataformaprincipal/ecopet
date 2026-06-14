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

  const res = await fetch(`${WEB}${pathname}`, { ...opts, headers });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const session = setCookie.split(";")[0];
    if (session.includes("=")) cookieJar.set("cookie", session);
    if (setCookie.includes("Max-Age=0") || setCookie.includes("max-age=0")) cookieJar.delete("cookie");
  }

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
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
  assert(hookSrc.includes("data?.data?.user"), "useFoundationSession deve ler envelope data.data.user");
  assert(hookSrc.includes("SESSION_CHANGED_EVENT"), "hook deve escutar evento de sessão");
  assert(hookSrc.includes("cache: \"no-store\""), "hook deve evitar cache velho");

  const searchPanel = readSrc("components/features/marketplace/search-panel.tsx");
  assert(searchPanel.includes("key={`${c.source}-${c.slug}`}"), "search-panel deve usar chave composta");
  assert(searchPanel.includes("product:") || searchPanel.includes("categoryOptionValue"), "search-panel deve usar value composto");
  assert(!searchPanel.includes("key={c.slug}"), "search-panel não deve usar apenas c.slug como key");

  const roleNavSrc = readSrc("lib/navigation/role-nav.ts");
  assert(!roleNavSrc.includes("common.signIn"), "role-nav autenticado não deve ter Entrar");
  assert(!roleNavSrc.includes("common.createAccount"), "role-nav autenticado não deve ter Criar Conta");

  const secureNavSrc = readSrc("lib/navigation/secure-nav.ts");
  assert(secureNavSrc.includes("common.signIn"), "secure-nav visitante deve ter Entrar");
  assert(secureNavSrc.includes("common.createAccount"), "secure-nav visitante deve ter Criar Conta");

  const clientBlock = extractRoleBlock(roleNavSrc, "CLIENT_MAIN");
  const clientKeys = navLabelKeysFromRoleNav(clientBlock);
  assert(clientKeys.includes("nav.myDashboard"), "CLIENT deve ver Meu Painel");
  assert(clientKeys.includes("nav.pets"), "CLIENT deve ver Meus Pets");
  assert(clientKeys.includes("nav.cart"), "CLIENT deve ver Carrinho");
  assert(!clientKeys.includes("common.signIn"), "CLIENT logado não deve ver Entrar");
  assert(!clientKeys.includes("common.createAccount"), "CLIENT logado não deve ver Criar Conta");

  const partnerBlock = extractRoleBlock(roleNavSrc, "PARTNER_MAIN");
  const partnerKeys = navLabelKeysFromRoleNav(partnerBlock);
  assert(partnerKeys.includes("nav.myDashboard"), "PARTNER deve ver Painel");
  assert(partnerKeys.includes("nav.services"), "PARTNER deve ver Serviços");
  assert(partnerKeys.includes("nav.orders"), "PARTNER deve ver Pedidos");

  const adminBlock = extractRoleBlock(roleNavSrc, "ADMIN_MAIN");
  const adminKeys = navLabelKeysFromRoleNav(adminBlock);
  assert(adminKeys.includes("nav.adminPanel"), "ADMIN deve ver Admin");
  assert(adminKeys.includes("nav.integrations"), "ADMIN deve ver Integrações");

  const formatRoleSrc = readSrc("lib/auth/format-user-role.ts");
  assert(formatRoleSrc.includes("Cliente"), "formatUserRole deve mapear CLIENT para Cliente");

  const rolePanelSrc = readSrc("components/features/foundation/role-panel.tsx");
  assert(rolePanelSrc.includes("formatUserRole"), "role-panel deve usar formatUserRole");

  const registerSrc = readSrc("components/features/foundation/register-form.tsx");
  assert(registerSrc.includes("notifySessionChanged"), "cadastro deve notificar mudança de sessão");
  assert(registerSrc.includes("router.refresh"), "cadastro deve refrescar após redirect");

  console.log("[static] código de navegação/sessão OK");

  // --- Verificações de API / sessão ---
  const guestMe = await req("/api/auth/me");
  assert(guestMe.status === 401, "visitante: /api/auth/me retorna 401");

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
      phone: `119${String(ts).slice(-8)}`,
      birthDate: "1990-05-15",
    }),
  });
  assert(register.status === 201, "cadastro CLIENT 201");
  assert(register.data.data?.redirectTo === "/dashboard/client", "redirect pós-cadastro");

  const meAfterRegister = await req("/api/auth/me");
  assert(meAfterRegister.status === 200, "sessão ativa após cadastro");
  assert(meAfterRegister.data.data?.user?.role === "CLIENT", "role CLIENT na sessão");
  assert(meAfterRegister.data.data?.user?.email === clientEmail, "email na sessão");

  const logout = await req("/api/auth/logout", { method: "POST" });
  assert(logout.status === 200, "logout ok");

  const meAfterLogout = await req("/api/auth/me");
  assert(meAfterLogout.status === 401, "sessão limpa após logout");

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
