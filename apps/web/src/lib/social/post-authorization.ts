import type { SocialPostStatus, SocialPostVisibility } from "@prisma/client";

export const SOCIAL_VISIBLE_STATUSES: SocialPostStatus[] = ["PUBLISHED", "REPORTED"];
export const SOCIAL_MAX_PINNED_POSTS = 3;

export const SOCIAL_REPORT_REASONS = [
  "SPAM",
  "HARASSMENT",
  "HATE",
  "VIOLENCE",
  "SEXUAL_CONTENT",
  "ANIMAL_ABUSE",
  "SCAM",
  "MISINFORMATION",
  "OTHER",
] as const;

export type SocialReportReasonValue = (typeof SOCIAL_REPORT_REASONS)[number];

export type PostAuthRecord = {
  authorId: string;
  visibility: SocialPostVisibility | "PUBLIC" | "FOLLOWERS" | "PRIVATE";
  status: SocialPostStatus | string;
  deletedAt?: Date | string | null;
  archivedAt?: Date | string | null;
  commentsEnabled?: boolean | null;
};

export type PostViewerContext = {
  viewerId?: string | null;
  followsAuthor?: boolean;
  isBlocked?: boolean;
  /** Owner trash listing / restore / hard-delete. */
  includeOwnTrash?: boolean;
};

function isOwner(post: Pick<PostAuthRecord, "authorId">, viewerId?: string | null) {
  return Boolean(viewerId && viewerId === post.authorId);
}

export function isSocialReportReason(value: unknown): value is SocialReportReasonValue {
  return typeof value === "string" && (SOCIAL_REPORT_REASONS as readonly string[]).includes(value);
}

export function canEditPost(actorId: string, authorId: string) {
  return actorId === authorId;
}

export function canDeletePost(actorId: string, authorId: string, isAdmin = false) {
  return isAdmin || actorId === authorId;
}

export function canPinPost(alreadyPinnedOther: number, pinning: boolean) {
  if (!pinning) return true;
  return alreadyPinnedOther < SOCIAL_MAX_PINNED_POSTS;
}

export function canCommentPost(post: PostAuthRecord, viewer: PostViewerContext = {}) {
  if (!canViewPost(post, viewer)) return false;
  if (post.deletedAt || post.archivedAt) return false;
  if (post.status === "REMOVED" || post.status === "HIDDEN") return false;
  return post.commentsEnabled !== false;
}

export function canViewPost(post: PostAuthRecord, viewer: PostViewerContext = {}): boolean {
  if (viewer.isBlocked) return false;

  const owner = isOwner(post, viewer.viewerId);

  if (post.deletedAt) {
    return owner && Boolean(viewer.includeOwnTrash);
  }

  if (post.status === "REMOVED" || post.status === "HIDDEN") {
    return false;
  }

  if (!SOCIAL_VISIBLE_STATUSES.includes(post.status as SocialPostStatus) && post.status !== "PUBLISHED" && post.status !== "REPORTED") {
    return owner;
  }

  if (post.archivedAt) {
    return owner;
  }

  if (!viewer.viewerId) {
    return post.visibility === "PUBLIC";
  }

  if (owner) return true;
  if (post.visibility === "PRIVATE") return false;
  if (post.visibility === "FOLLOWERS") return Boolean(viewer.followsAuthor);
  return post.visibility === "PUBLIC";
}

export function visibilityWhereForViewer(params: {
  viewerId?: string;
  followingIds?: string[];
}):
  | { visibility: "PUBLIC" }
  | {
      OR: Array<
        | { visibility: "PUBLIC" }
        | { authorId: string }
        | { visibility: "FOLLOWERS"; authorId: { in: string[] } }
      >;
    } {
  if (!params.viewerId) {
    return { visibility: "PUBLIC" };
  }
  return {
    OR: [
      { visibility: "PUBLIC" },
      { authorId: params.viewerId },
      { visibility: "FOLLOWERS", authorId: { in: params.followingIds ?? [] } },
    ],
  };
}
