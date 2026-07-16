/**
 * Garante acessibilidade global: montagem única no layout raiz,
 * fora de auth/role, sem duplicatas em layouts filhos.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const webSrc = path.join(root, "apps", "web", "src");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function readSrc(relPath) {
  return fs.readFileSync(path.join(webSrc, relPath), "utf8");
}

function walkLayouts(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkLayouts(full, acc);
    else if (entry.name === "layout.tsx") acc.push(full);
  }
  return acc;
}

function main() {
  console.log("=== EcoPet Global Accessibility Tests ===\n");

  const rootLayout = readSrc("app/layout.tsx");
  assert(rootLayout.includes("AccessibilityProvider"), "layout raiz deve ter AccessibilityProvider");
  assert(rootLayout.includes("GlobalAccessibility"), "layout raiz deve montar GlobalAccessibility");
  assert(
    !rootLayout.includes("AccessibilityToolbarLazy") || rootLayout.includes("GlobalAccessibility"),
    "toolbar deve vir via GlobalAccessibility"
  );
  assert(
    rootLayout.indexOf("<GlobalAccessibility") > rootLayout.indexOf("</AuthGateProvider>"),
    "GlobalAccessibility deve ficar fora de AuthGateProvider"
  );
  assert(
    rootLayout.indexOf("<GlobalAccessibility") > rootLayout.indexOf("</SupportChatProvider>"),
    "GlobalAccessibility deve ficar fora de SupportChatProvider"
  );
  assert(
    rootLayout.indexOf("<GlobalAccessibility") < rootLayout.indexOf("</AccessibilityProvider>"),
    "GlobalAccessibility deve ficar dentro de AccessibilityProvider"
  );
  assert(
    rootLayout.indexOf("<GlobalAccessibility") < rootLayout.indexOf("</I18nProvider>"),
    "GlobalAccessibility deve ficar dentro de I18nProvider (labels)"
  );
  assert(!rootLayout.includes("role ===") && !rootLayout.includes("isAuthenticated"), "layout raiz não condiciona a11y a sessão");

  const globalA11y = readSrc("components/shared/accessibility/global-accessibility.tsx");
  assert(globalA11y.includes("AccessibilityToolbarLazy"), "GlobalAccessibility monta toolbar");
  assert(globalA11y.includes("VLibrasWidget"), "GlobalAccessibility monta VLibras");

  const toolbar = readSrc("components/shared/accessibility/accessibility-toolbar.tsx");
  assert(toolbar.includes("data-ecopet-a11y-root"), "toolbar marca root para testes/DOM");
  assert(toolbar.includes("bottom-28"), "FAB mobile acima da bottom nav");
  assert(toolbar.includes("librasEnabled") || toolbar.includes("libras"), "toolbar preserva VLibras toggle");
  assert(toolbar.includes("highContrast"), "toolbar preserva contraste");
  assert(toolbar.includes("increaseFont"), "toolbar preserva aumento de fonte");
  assert(toolbar.includes("brailleEnabled") || toolbar.includes("toggleBraille"), "toolbar preserva Braille");
  assert(toolbar.includes("readingMask"), "toolbar preserva máscara de leitura");
  assert(toolbar.includes("readingGuide"), "toolbar preserva guia de leitura");
  assert(toolbar.includes("largeCursor"), "toolbar preserva cursor ampliado");
  assert(toolbar.includes("pauseAnimations"), "toolbar preserva redução de movimento");
  assert(toolbar.includes("reset"), "toolbar preserva restaurar configurações");

  const provider = readSrc("providers/accessibility-provider.tsx");
  assert(provider.includes("ReadingAssist"), "provider monta ReadingAssist");
  assert(provider.includes("BrailleMode"), "provider monta BrailleMode");
  assert(provider.includes("applyPreferences"), "provider aplica preferências no documento");

  const store = readSrc("store/accessibility-store.ts");
  assert(store.includes("persist"), "preferências usam persistência");

  const vlibras = readSrc("components/accessibility/VLibrasWidget.tsx");
  assert(vlibras.includes("VLIBRAS_SCRIPT_URL") || vlibras.includes("vlibras"), "VLibras carrega script");
  assert(vlibras.includes("createPortal"), "VLibras usa portal único no body");

  // Nenhum layout filho deve remontar toolbar/VLibras/provider
  const layoutFiles = walkLayouts(path.join(webSrc, "app"));
  const rootLayoutPath = path.join(webSrc, "app", "layout.tsx");
  for (const file of layoutFiles) {
    if (path.resolve(file) === path.resolve(rootLayoutPath)) continue;
    const src = fs.readFileSync(file, "utf8");
    const rel = path.relative(webSrc, file);
    assert(!src.includes("AccessibilityToolbar"), `${rel} não deve montar AccessibilityToolbar`);
    assert(!src.includes("AccessibilityToolbarLazy"), `${rel} não deve montar AccessibilityToolbarLazy`);
    assert(!src.includes("GlobalAccessibility"), `${rel} não deve remontar GlobalAccessibility`);
    assert(!src.includes("VLibrasWidget"), `${rel} não deve montar VLibrasWidget`);
    assert(!src.includes("AccessibilityProvider"), `${rel} não deve remontar AccessibilityProvider`);
  }
  console.log(`[static] ${layoutFiles.length} layouts verificados — sem duplicata de a11y`);

  // Rotas críticas devem existir — a11y vem do layout raiz (App Router), não da página
  const criticalRoutes = [
    ["app/page.tsx"],
    ["app/(auth)/login/page.tsx"],
    ["app/(auth)/cadastro/page.tsx", "app/(auth)/register/page.tsx", "app/cadastro/page.tsx"],
    ["app/(auth)/esqueci-senha/page.tsx", "app/(auth)/recuperar-senha/page.tsx", "app/recuperar-senha/page.tsx"],
    ["app/(app)/explorar/page.tsx", "app/explorar/page.tsx"],
    ["app/(app)/marketplace/page.tsx", "app/marketplace/page.tsx"],
    ["app/(app)/social/page.tsx", "app/(app)/feed/page.tsx"],
    ["app/(app)/eccopet/page.tsx", "app/(app)/ecopet-ai/page.tsx"],
    ["app/(app)/perfil/page.tsx", "app/(app)/cliente/perfil/page.tsx"],
    ["app/(app)/admin/page.tsx"],
    ["app/(app)/parceiro/page.tsx", "app/(app)/partner/page.tsx", "app/(app)/partner/dashboard/page.tsx"],
    ["app/(app)/ong/page.tsx", "app/(app)/ngo/page.tsx", "app/(app)/ngo/dashboard/page.tsx"],
    ["app/(app)/cliente/page.tsx", "app/(app)/client/page.tsx"],
  ];

  for (const candidates of criticalRoutes) {
    const found = candidates.some((rel) => fs.existsSync(path.join(webSrc, rel)));
    assert(found, `rota crítica ausente (qualquer de): ${candidates.join(" | ")}`);
  }
  console.log("[static] rotas críticas presentes — cobertas pelo layout raiz");

  // Contagem de montagens no src (apenas definições de uso em layout/global)
  const toolbarMounts = (rootLayout.match(/GlobalAccessibility/g) || []).length;
  assert(toolbarMounts >= 1, "GlobalAccessibility referenciado no layout raiz");

  console.log("\n✅ Global accessibility tests passed");
}

main();
