import type { MessageTree } from "@/lib/i18n/types";
import type { LocaleCode } from "@/i18n/locales/registry";
import { STATIC_LOCALES } from "@/i18n/locales/registry";
import ptBR from "@/i18n/locales/pt-BR.json";
import en from "@/i18n/locales/en.json";
import es from "@/i18n/locales/es.json";

/** Bundles estáticos — adicionar JSON aqui quando tradução humana estiver pronta */
const STATIC_BUNDLE_IMPORTS: Partial<Record<LocaleCode, MessageTree>> = {
  "pt-BR": ptBR as MessageTree,
  en: en as MessageTree,
  es: es as MessageTree,
};

export function getStaticBundle(locale: LocaleCode): MessageTree | undefined {
  if (!STATIC_LOCALES.includes(locale)) return undefined;
  return STATIC_BUNDLE_IMPORTS[locale];
}

export function getAllStaticBundles(): Partial<Record<LocaleCode, MessageTree>> {
  return { ...STATIC_BUNDLE_IMPORTS };
}

export function getFromTree(tree: MessageTree, key: string): string | undefined {
  const parts = key.split(".");
  let node: string | MessageTree = tree;
  for (const part of parts) {
    if (typeof node !== "object" || node === null || !(part in node)) return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

export function flattenStaticKeys(tree: MessageTree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[path] = v;
    else Object.assign(out, flattenStaticKeys(v, path));
  }
  return out;
}

/** Chaves fonte (pt-BR) para auto-tradução e substituição futura por bundle humano */
export const SOURCE_KEYS = flattenStaticKeys(ptBR as MessageTree);
