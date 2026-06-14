/**
 * Migração arquitetural EcoPet — move arquivos e atualiza imports.
 * Uso: node scripts/migrate-architecture.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WEB_SRC = path.join(ROOT, "apps", "web", "src");

const IMPORT_REPLACEMENTS = [
  [/@\/components\/layout\//g, "@/components/layouts/"],
  [/@\/lib\/validations\//g, "@/schemas/"],
  [/@\/lib\/validation\//g, "@/schemas/validation/"],
  [/@\/components\/accessibility\//g, "@/components/shared/accessibility/"],
  [/@\/components\/address\//g, "@/components/shared/address/"],
  [/@\/components\/brand\//g, "@/components/shared/brand/"],
  [/@\/components\/legal\//g, "@/components/shared/legal/"],
  [/@\/components\/navigation\//g, "@/components/shared/navigation/"],
  [/@\/components\/advisory\//g, "@/components/features/advisory/"],
  [/@\/components\/agenda\//g, "@/components/features/agenda/"],
  [/@\/components\/agro\//g, "@/components/features/agro/"],
  [/@\/components\/ai\//g, "@/components/features/ai/"],
  [/@\/components\/auth\//g, "@/components/features/auth/"],
  [/@\/components\/dashboard\//g, "@/components/features/dashboard/"],
  [/@\/components\/ecosystem\//g, "@/components/features/ecosystem/"],
  [/@\/components\/explore\//g, "@/components/features/explore/"],
  [/@\/components\/foundation\//g, "@/components/features/foundation/"],
  [/@\/components\/gestor\//g, "@/components/features/gestor/"],
  [/@\/components\/health\//g, "@/components/features/health/"],
  [/@\/components\/home\//g, "@/components/features/home/"],
  [/@\/components\/i18n\//g, "@/components/features/i18n/"],
  [/@\/components\/integrations\//g, "@/components/features/integrations/"],
  [/@\/components\/iot\//g, "@/components/features/iot/"],
  [/@\/components\/marketplace\//g, "@/components/features/marketplace/"],
  [/@\/components\/my-pet\//g, "@/components/features/my-pet/"],
  [/@\/components\/notifications\//g, "@/components/features/notifications/"],
  [/@\/components\/orders\//g, "@/components/features/orders/"],
  [/@\/components\/petshop-web\//g, "@/components/features/petshop-web/"],
  [/@\/components\/platform\//g, "@/components/features/platform/"],
  [/@\/components\/profile\//g, "@/components/features/profile/"],
  [/@\/components\/registration\//g, "@/components/features/registration/"],
  [/@\/components\/settings\//g, "@/components/features/settings/"],
  [/@\/components\/social\//g, "@/components/features/social/"],
  [/@\/components\/support\//g, "@/components/features/support/"],
  [/@\/components\/wallet\//g, "@/components/features/wallet/"],
  [/\.\/globals\.css/g, "@/styles/globals.css"],
  [/\.\/accessibility\.css/g, "@/styles/accessibility.css"],
  [/"@\/components\/layout"/g, '"@/components/layouts"'],
  [/'@\/components\/layout'/g, "'@/components/layouts'"],
];

const MOVES = [
  { from: "components/layout", to: "components/layouts" },
  { from: "components/accessibility", to: "components/shared/accessibility" },
  { from: "components/address", to: "components/shared/address" },
  { from: "components/brand", to: "components/shared/brand" },
  { from: "components/legal", to: "components/shared/legal" },
  { from: "components/navigation", to: "components/shared/navigation" },
  { from: "components/advisory", to: "components/features/advisory" },
  { from: "components/agenda", to: "components/features/agenda" },
  { from: "components/agro", to: "components/features/agro" },
  { from: "components/ai", to: "components/features/ai" },
  { from: "components/auth", to: "components/features/auth" },
  { from: "components/dashboard", to: "components/features/dashboard" },
  { from: "components/ecosystem", to: "components/features/ecosystem" },
  { from: "components/explore", to: "components/features/explore" },
  { from: "components/foundation", to: "components/features/foundation" },
  { from: "components/gestor", to: "components/features/gestor" },
  { from: "components/health", to: "components/features/health" },
  { from: "components/home", to: "components/features/home" },
  { from: "components/i18n", to: "components/features/i18n" },
  { from: "components/integrations", to: "components/features/integrations" },
  { from: "components/iot", to: "components/features/iot" },
  { from: "components/marketplace", to: "components/features/marketplace" },
  { from: "components/my-pet", to: "components/features/my-pet" },
  { from: "components/notifications", to: "components/features/notifications" },
  { from: "components/orders", to: "components/features/orders" },
  { from: "components/petshop-web", to: "components/features/petshop-web" },
  { from: "components/platform", to: "components/features/platform" },
  { from: "components/profile", to: "components/features/profile" },
  { from: "components/registration", to: "components/features/registration" },
  { from: "components/settings", to: "components/features/settings" },
  { from: "components/social", to: "components/features/social" },
  { from: "components/support", to: "components/features/support" },
  { from: "components/wallet", to: "components/features/wallet" },
  { from: "lib/validations", to: "schemas" },
  { from: "lib/validation", to: "schemas/validation" },
  { from: "app/globals.css", to: "styles/globals.css" },
  { from: "app/accessibility.css", to: "styles/accessibility.css" },
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function moveDir(src, dest) {
  if (!fs.existsSync(src)) return false;
  ensureDir(path.dirname(dest));
  if (fs.existsSync(dest)) {
    console.warn(`SKIP (exists): ${dest}`);
    return false;
  }
  fs.renameSync(src, dest);
  console.log(`MOVED: ${path.relative(WEB_SRC, src)} → ${path.relative(WEB_SRC, dest)}`);
  return true;
}

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, acc);
    else if (/\.(ts|tsx|js|jsx|css|json|md)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

function updateImports() {
  const files = walkFiles(WEB_SRC);
  let changed = 0;
  for (const file of files) {
    let content = fs.readFileSync(file, "utf8");
    let next = content;
    for (const [pattern, replacement] of IMPORT_REPLACEMENTS) {
      next = next.replace(pattern, replacement);
    }
    if (next !== content) {
      fs.writeFileSync(file, next, "utf8");
      changed++;
    }
  }
  console.log(`Updated imports in ${changed} files`);
}

function runMoves() {
  for (const { from, to } of MOVES) {
    moveDir(path.join(WEB_SRC, from), path.join(WEB_SRC, to));
  }
}

console.log("=== EcoPet Architecture Migration ===\n");
runMoves();
updateImports();
console.log("\nDone.");
