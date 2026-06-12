import { prisma } from "@ecopet/database";

const USERNAME_REGEX = /^[a-z0-9._-]+$/;

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
    .slice(0, 24);
}

/** Gera username único a partir do e-mail (PETSHOP/ONG quando não informado). */
export async function ensureUniqueUsername(email: string, hint?: string): Promise<string> {
  const emailLocal = email.split("@")[0] ?? "user";
  const baseRaw = slugify(hint || emailLocal) || "ecopet";
  const base = baseRaw.length >= 3 ? baseRaw : `${baseRaw}${Date.now().toString(36).slice(-4)}`;

  let candidate = base.slice(0, 30);
  if (!USERNAME_REGEX.test(candidate)) {
    candidate = slugify(candidate) || "ecopetuser";
  }

  let suffix = 0;
  while (suffix < 1000) {
    const tryName = suffix === 0 ? candidate : `${candidate.slice(0, Math.max(3, 28 - String(suffix).length))}${suffix}`;
    const taken = await prisma.user.findUnique({ where: { username: tryName } });
    if (!taken) return tryName;
    suffix += 1;
  }

  return `user${Date.now().toString(36)}`;
}
