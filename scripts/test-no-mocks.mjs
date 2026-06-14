/**
 * EcoPet — test:no-mocks
 * Garante que o runtime da app não importa mocks, demos ou fixtures fictícias.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const APP_SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "apps", "web", "src");
const FIXTURES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "tests", "fixtures");

const FORBIDDEN_IMPORT_PATTERNS = [
  /mock-data/,
  /DemoContentBanner/,
  /from\s+["'][^"']*\/fixtures\//,
];

const FORBIDDEN_SOURCE_PATTERNS = [
  /\bMOCK_[A-Z_]+\b/,
  /\bfake[A-Z_]/,
  /\bdemoBanner\b/,
  /\bDemoContentBanner\b/,
  /\bsuggestedProfiles\b/,
  /\bdefaultProducts\b/,
  /\bdefaultServices\b/,
];

const ALLOWED_PATHS = new Set([
  path.normalize("lib/production-guard.ts"),
]);

const IGNORE_DIRS = new Set(["node_modules", ".next"]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function rel(file) {
  return path.relative(APP_SRC, file).split(path.sep).join("/");
}

let failed = 0;
let passed = 0;

function ok(msg) {
  console.log(`✓ ${msg}`);
  passed++;
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  failed++;
}

console.log("=== EcoPet — test:no-mocks ===\n");

const appFiles = walk(APP_SRC);

for (const file of appFiles) {
  const r = rel(file);
  if (ALLOWED_PATHS.has(path.normalize(r))) continue;

  const content = fs.readFileSync(file, "utf8");

  for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
    if (pattern.test(content)) {
      fail(`${r}: import proibido (${pattern})`);
    }
  }

  for (const pattern of FORBIDDEN_SOURCE_PATTERNS) {
    if (pattern.test(content)) {
      fail(`${r}: referência proibida (${pattern})`);
    }
  }
}

const mockFiles = appFiles.filter((f) => f.includes("mock-data") || /mock-data\.ts$/.test(f));
if (mockFiles.length > 0) {
  for (const f of mockFiles) {
    fail(`arquivo mock ainda existe: ${rel(f)}`);
  }
} else {
  ok("nenhum arquivo mock-data no app runtime");
}

if (!fs.existsSync(FIXTURES_DIR)) {
  ok("tests/fixtures ausente (ok se não houver fixtures)");
} else {
  const fixtureImports = appFiles.filter((f) => {
    const c = fs.readFileSync(f, "utf8");
    return /tests\/fixtures|@\/\.\.\/tests\/fixtures/.test(c);
  });
  if (fixtureImports.length > 0) {
    for (const f of fixtureImports) fail(`${rel(f)} importa tests/fixtures`);
  } else {
    ok("app não importa tests/fixtures");
  }
}

const seedPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "packages", "database", "prisma", "seed.ts");
const seedContent = fs.readFileSync(seedPath, "utf8");
const fakeSeedPatterns = [/user\.create/i, /pet\.create/i, /product\.create/i, /post\.create/i, /notification\.create/i];
for (const p of fakeSeedPatterns) {
  if (p.test(seedContent)) fail(`seed.ts contém ${p}`);
}
if (!fakeSeedPatterns.some((p) => p.test(seedContent))) {
  ok("seed.ts não cria usuários/pets/produtos/posts/notificações fake");
}

console.log(`\n${passed} passaram, ${failed} falharam`);
process.exit(failed > 0 ? 1 : 0);
