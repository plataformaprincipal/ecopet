export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function serializePost<T extends { mediaUrls?: unknown }>(post: T) {
  return { ...post, mediaUrls: asStringArray(post.mediaUrls) };
}

export function serializeProduct<T extends { images?: unknown }>(item: T) {
  return { ...item, images: asStringArray(item.images) };
}
