import { PostType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireSocialPoster } from "@/lib/social/permissions";
import { checkSocialRateLimit } from "@/lib/social/rate-limit";
import { SOCIAL_RATE_LIMITS } from "@/lib/social/constants";
import { SocialError } from "@/lib/social/errors";
import { isStoryPubliclyActive } from "@/lib/social/story-policy";

export { isStoryPubliclyActive };

const STORY_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];

export async function listActiveStories() {
  const now = new Date();
  const rows = await prisma.post.findMany({
    where: {
      type: PostType.STORY,
      isHidden: false,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    authorId: row.authorId,
    author: row.author,
    content: row.content,
    mediaUrls: Array.isArray(row.mediaUrls) ? (row.mediaUrls as string[]) : [],
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  }));
}

export async function createStory(params: {
  authorId: string;
  content?: string;
  mediaUrl: string;
  mimeType: string;
  fileSize: number;
}) {
  await requireSocialPoster(params.authorId);
  if (!ALLOWED.includes(params.mimeType)) {
    throw new SocialError("Formato de mídia não suportado. Use JPEG, PNG, WebP ou MP4.", "VALIDATION", 400);
  }
  if (params.fileSize > MAX_BYTES) {
    throw new SocialError("Arquivo muito grande. Máximo 8 MB.", "VALIDATION", 400);
  }
  if (!params.mediaUrl.startsWith("https://") && !params.mediaUrl.startsWith("/")) {
    throw new SocialError("URL de mídia inválida.", "VALIDATION", 400);
  }
  if (!checkSocialRateLimit(`story:${params.authorId}`, SOCIAL_RATE_LIMITS.createPost.limit, SOCIAL_RATE_LIMITS.createPost.windowMs)) {
    throw new SocialError("Muitas publicações. Aguarde um momento.", "RATE_LIMIT", 429);
  }

  return prisma.post.create({
    data: {
      authorId: params.authorId,
      type: PostType.STORY,
      content: params.content?.trim().slice(0, 200) || null,
      mediaUrls: [params.mediaUrl],
      expiresAt: new Date(Date.now() + STORY_TTL_MS),
    },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

export async function getActiveStory(id: string) {
  const row = await prisma.post.findFirst({
    where: { id, type: PostType.STORY, isHidden: false },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });
  if (!row || !isStoryPubliclyActive(row.expiresAt)) return null;
  return {
    id: row.id,
    authorId: row.authorId,
    author: row.author,
    content: row.content,
    mediaUrls: Array.isArray(row.mediaUrls) ? (row.mediaUrls as string[]) : [],
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  };
}

export async function deleteOwnStory(params: { userId: string; storyId: string }) {
  const row = await prisma.post.findFirst({
    where: { id: params.storyId, type: PostType.STORY },
  });
  if (!row) throw new SocialError("Story não encontrado.", "NOT_FOUND", 404);
  if (row.authorId !== params.userId) {
    throw new SocialError("Você não pode remover este story.", "FORBIDDEN", 403);
  }
  await prisma.post.update({
    where: { id: row.id },
    data: { isHidden: true },
  });
  return { id: row.id };
}

export async function requireStoryAuthor() {
  const { user, error } = await requireAuth();
  if (error) return { user: null, error };
  return { user, error: null };
}
