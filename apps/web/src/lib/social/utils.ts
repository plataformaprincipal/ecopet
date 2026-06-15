import type { SocialMediaType } from "@prisma/client";

export function slugifyHashtag(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractHashtags(content: string): string[] {
  const matches = content.match(/#[\p{L}\p{N}_]{2,50}/gu) ?? [];
  const unique = new Set<string>();
  for (const m of matches) {
    const name = m.slice(1).trim();
    if (name) unique.add(name.toLowerCase());
  }
  return [...unique];
}

export function mimeToMediaType(mimeType: string): SocialMediaType {
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType === "application/pdf") return "DOCUMENT";
  return "IMAGE";
}

export function buildPostShareLink(postId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/feed/post/${postId}`;
}

export function sanitizePublicText(text: string | null | undefined, max = 500): string | null {
  if (!text) return null;
  return text.slice(0, max);
}
