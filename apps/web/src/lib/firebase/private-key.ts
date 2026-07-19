/**
 * Normalização da private key Firebase — sem side-effects e sem server-only
 * (permite testes unitários e uso pelo Admin SDK).
 */

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const v = value.toLowerCase();
  return (
    v.includes("xxxxxxxxx") ||
    v.includes("your_") ||
    v.includes("changeme") ||
    v.includes("replace_me") ||
    v === "xxx"
  );
}

/** Normaliza private key com \\n literais (comum na Vercel). Nunca logar o resultado. */
export function normalizeFirebasePrivateKey(raw: string | undefined): string | null {
  if (!raw || isPlaceholder(raw)) return null;
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\\n/g, "\n");
  if (!key.includes("BEGIN") || !key.includes("PRIVATE KEY")) {
    return null;
  }
  return key;
}
