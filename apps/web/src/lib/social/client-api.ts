import type { SocialReportReason } from "@prisma/client";

type ApiBody<T> = { success: boolean; data?: T; error?: { code: string; message: string } };

export type ApiSocialPost = {
  id: string;
  authorId: string;
  authorRole?: string | null;
  type?: string;
  author: { id: string; name: string; avatarUrl: string | null; role: string };
  pet?: { id: string; name: string; photo: string | null; species: string } | null;
  content: string | null;
  visibility: string;
  status: string;
  locationText: string | null;
  linkedProductId?: string | null;
  linkedServiceId?: string | null;
  linkedCampaignId?: string | null;
  linkedPetId?: string | null;
  adoptionMeta?: Record<string, unknown> | null;
  isPinned?: boolean;
  isFeatured?: boolean;
  media: { id: string; fileUrl: string; fileName: string; mimeType: string; mediaType: string; sortOrder: number }[];
  hashtags: { id: string; name: string; slug: string }[];
  counts: { likes: number; comments: number; shares: number; saves: number };
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  viewerState?: { liked: boolean; saved: boolean; followingAuthor: boolean };
};

export type ApiSocialComment = {
  id: string;
  postId: string;
  authorId: string;
  parentCommentId: string | null;
  content: string | null;
  status: string;
  author: { id: string; name: string; avatarUrl: string | null; role: string };
  counts: { likes: number; replies?: number };
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  replies?: ApiSocialComment[];
  viewerState?: { liked: boolean };
};

export type ApiPublicProfile = {
  userId: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  visibility: string;
  role: string;
  roleLabel: string;
  counts: { posts: number; followers: number; following: number };
  viewerState?: { isFollowing: boolean; isBlocked: boolean; isSelf: boolean };
};

async function socialFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = (await res.json().catch(() => ({}))) as ApiBody<T>;
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message ?? `Erro ${res.status}`);
  }
  return body.data as T;
}

export async function fetchFeed(params?: { cursor?: string; hashtag?: string; authorId?: string; type?: string }) {
  const q = new URLSearchParams();
  if (params?.cursor) q.set("cursor", params.cursor);
  if (params?.hashtag) q.set("hashtag", params.hashtag);
  if (params?.authorId) q.set("authorId", params.authorId);
  if (params?.type) q.set("type", params.type);
  return socialFetch<{ posts: ApiSocialPost[]; nextCursor: string | null }>(`/api/social/feed?${q}`);
}

export async function createPost(data: {
  content?: string;
  type?: string;
  visibility?: string;
  petId?: string;
  locationText?: string;
  linkedProductId?: string;
  linkedServiceId?: string;
  linkedCampaignId?: string;
  adoptionMeta?: Record<string, unknown>;
  media?: unknown[];
}) {
  return socialFetch<{ post: ApiSocialPost }>("/api/social/posts", { method: "POST", body: JSON.stringify(data) });
}

export async function fetchPost(postId: string) {
  return socialFetch<{ post: ApiSocialPost }>(`/api/social/posts/${postId}`);
}

export async function updatePost(postId: string, content: string) {
  return socialFetch<{ post: ApiSocialPost }>(`/api/social/posts/${postId}`, { method: "PATCH", body: JSON.stringify({ content }) });
}

export async function deletePost(postId: string) {
  return socialFetch<{ post: ApiSocialPost }>(`/api/social/posts/${postId}`, { method: "DELETE" });
}

export async function likePost(postId: string) {
  return socialFetch<{ liked: boolean; count: number }>(`/api/social/posts/${postId}/like`, { method: "POST" });
}

export async function unlikePost(postId: string) {
  return socialFetch<{ liked: boolean; count: number }>(`/api/social/posts/${postId}/like`, { method: "DELETE" });
}

export async function savePost(postId: string) {
  return socialFetch<{ saved: boolean }>(`/api/social/posts/${postId}/save`, { method: "POST" });
}

export async function unsavePost(postId: string) {
  return socialFetch<{ saved: boolean }>(`/api/social/posts/${postId}/save`, { method: "DELETE" });
}

export async function sharePost(postId: string, data?: { targetConversationId?: string; message?: string }) {
  return socialFetch<{ shareId: string; link: string; chatMessageId?: string }>(`/api/social/posts/${postId}/share`, {
    method: "POST",
    body: JSON.stringify(data ?? {}),
  });
}

export async function fetchSavedPosts(cursor?: string) {
  const q = cursor ? `?cursor=${cursor}` : "";
  return socialFetch<{ posts: ApiSocialPost[]; nextCursor: string | null }>(`/api/social/saved${q}`);
}

export async function fetchComments(postId: string, cursor?: string) {
  const q = cursor ? `?cursor=${cursor}` : "";
  return socialFetch<{ comments: ApiSocialComment[]; nextCursor: string | null }>(`/api/social/posts/${postId}/comments${q}`);
}

export async function createComment(postId: string, content: string, parentCommentId?: string) {
  return socialFetch<{ comment: ApiSocialComment }>(`/api/social/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content, parentCommentId }),
  });
}

export async function fetchPublicProfile(userId: string) {
  return socialFetch<{ profile: ApiPublicProfile }>(`/api/social/profiles/${userId}`);
}

export async function fetchMyProfile() {
  return socialFetch<{ profile: ApiPublicProfile }>("/api/social/profiles/me");
}

export async function updateMyProfile(data: Partial<{ displayName: string; bio: string; avatarUrl: string; coverUrl: string; visibility: string }>) {
  return socialFetch<{ profile: ApiPublicProfile }>("/api/social/profiles/me", { method: "PUT", body: JSON.stringify(data) });
}

export async function fetchProfilePosts(userId: string, cursor?: string) {
  const q = cursor ? `?cursor=${cursor}` : "";
  return socialFetch<{ posts: ApiSocialPost[]; nextCursor: string | null }>(`/api/social/profiles/${userId}/posts${q}`);
}

export async function followUser(userId: string) {
  return socialFetch<{ following: boolean }>(`/api/social/profiles/${userId}/follow`, { method: "POST" });
}

export async function unfollowUser(userId: string) {
  return socialFetch<{ following: boolean }>(`/api/social/profiles/${userId}/follow`, { method: "DELETE" });
}

export async function blockUser(userId: string, reason?: string) {
  return socialFetch<{ blocked: boolean }>(`/api/social/profiles/${userId}/block`, { method: "POST", body: JSON.stringify({ reason }) });
}

export async function searchSocial(q: string, type?: string) {
  const params = new URLSearchParams({ q });
  if (type) params.set("type", type);
  return socialFetch<{ posts: unknown[]; hashtags: unknown[]; profiles: unknown[] }>(`/api/social/search?${params}`);
}

export async function fetchHashtag(slug: string, cursor?: string) {
  const q = cursor ? `?cursor=${cursor}` : "";
  return socialFetch<{ hashtag: { name: string; slug: string; usageCount: number }; posts: ApiSocialPost[]; nextCursor: string | null }>(
    `/api/social/hashtags/${slug}${q}`
  );
}

export async function createReport(data: { postId?: string; commentId?: string; reason: SocialReportReason; description?: string }) {
  return socialFetch<{ report: { id: string; status: string } }>("/api/social/reports", { method: "POST", body: JSON.stringify(data) });
}

export async function uploadSocialMedia(file: File) {
  const form = new FormData();
  form.set("purpose", "social_post_media");
  form.set("file", file);
  const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: form });
  const body = await res.json();
  if (!res.ok || body.success === false) throw new Error(body.error?.message ?? "Falha no upload");
  return body.data.upload as { url: string; fileName: string; mimeType: string; sizeBytes: number; provider: string };
}
