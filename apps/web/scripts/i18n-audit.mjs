#!/usr/bin/env node
/**
 * Auditoria i18n — detecta prováveis strings PT-BR hardcoded em JSX/TSX
 * nas áreas públicas prioritárias. Heurística: texto entre > e <, ou
 * literais em props de UI (placeholder/title/aria-label/label), contendo
 * acentos PT ou termos comuns do produto.
 *
 * Uso: node scripts/i18n-audit.mjs [--all]
 * Saída: lista "arquivo:linha  trecho" + contagem. Código de saída 1 se houver achados.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

const SCAN_DIRS = process.argv.includes("--all")
  ? [root]
  : [
      path.join(root, "components", "features", "public"),
      path.join(root, "components", "features", "public-premium"),
      path.join(root, "components", "features", "public-client"),
      path.join(root, "components", "features", "social", "ecopet-social"),
      path.join(root, "components", "features", "social", "hub"),
      path.join(root, "components", "features", "eccopet-ai"),
    ];

// Termos PT comuns do produto + padrão de acentuação portuguesa.
const PT_TERMS =
  /\b(Entrar|Criar conta|Explorar|Rede Social|Perfil|Carrinho|Pedido|Pedidos|Agendamento|Agendar|Curtir|Comentar|Comprar|Servi[çc]o|Produto|Ado[çc][ãa]o|Notifica[çc][õo]es|Mensagens|Buscar|Filtros|Seguir|Salvar|Compartilhar|Denunciar|Voc[êe]|n[ãa]o|Configura[çc][õo]es)\b/;
const ACCENTS = /[áàâãéêíóôõúüç]/i;

// Ignora linhas que já usam tradução ou são claramente código.
const IGNORE = /\b(t\(|className|import |from "|https?:|aria-hidden|key=|data-)/;

// Componentes legados NÃO renderizados pelas rotas atuais (substituídos pela
// experiência premium / EccoPet Social). Mantidos no repo mas fora da auditoria.
const LEGACY_EXCLUDE = new Set([
  "public-social-page.tsx",
  "public-explore-page.tsx",
  "public-home-page.tsx",
  "public-marketplace-page.tsx",
  "public-hero.tsx",
  "public-profile-gate.tsx",
  "hub-feed.tsx",
  "hub-left-sidebar.tsx",
]);

const results = [];

function scanFile(file) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) return;

    // 1) Texto JSX entre tags: >Texto<
    const jsxText = [...line.matchAll(/>([^<>{}\n]+)</g)].map((m) => m[1].trim());
    // 2) Strings em props textuais
    const propText = [
      ...line.matchAll(/(?:placeholder|title|aria-label|label)\s*=\s*"([^"]+)"/g),
    ].map((m) => m[1]);

    for (const txt of [...jsxText, ...propText]) {
      if (!txt || txt.length < 3) continue;
      if (!(PT_TERMS.test(txt) || ACCENTS.test(txt))) continue;
      if (/^[A-Z_]+$/.test(txt)) continue; // enums
      if (IGNORE.test(txt)) continue;
      results.push({ file: path.relative(root, file), line: i + 1, txt });
    }
  });
}

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full);
    else if (/\.(tsx|ts)$/.test(entry) && !/\.d\.ts$/.test(entry) && !LEGACY_EXCLUDE.has(entry))
      scanFile(full);
  }
}

for (const dir of SCAN_DIRS) walk(dir);

if (results.length === 0) {
  console.log("✓ i18n-audit: nenhuma string PT-BR hardcoded detectada nas áreas escaneadas.");
  process.exit(0);
}

console.log(`⚠ i18n-audit: ${results.length} possível(is) string(s) hardcoded:\n`);
for (const r of results) {
  console.log(`  ${r.file}:${r.line}  →  ${r.txt}`);
}
process.exit(1);
