import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canCommentPost,
  canDeletePost,
  canEditPost,
  canPinPost,
  canViewPost,
  isSocialReportReason,
  SOCIAL_MAX_PINNED_POSTS,
} from "./post-authorization";

describe("social authorization rules", () => {
  it("proprietário pode alterar; terceiro não", () => {
    assert.equal(canEditPost("a", "a"), true);
    assert.equal(canEditPost("b", "a"), false);
  });

  it("não autorizado não exclui; admin pode", () => {
    assert.equal(canDeletePost("b", "a", false), false);
    assert.equal(canDeletePost("a", "a", false), true);
    assert.equal(canDeletePost("admin", "a", true), true);
  });

  it("owner vê todos os próprios posts, inclusive arquivados", () => {
    assert.equal(
      canViewPost(
        { authorId: "a", visibility: "PRIVATE", status: "PUBLISHED", archivedAt: new Date() },
        { viewerId: "a" }
      ),
      true
    );
  });

  it("seguidor vê PUBLIC + FOLLOWERS", () => {
    const base = { authorId: "a", status: "PUBLISHED" as const };
    assert.equal(canViewPost({ ...base, visibility: "PUBLIC" }, { viewerId: "b", followsAuthor: true }), true);
    assert.equal(canViewPost({ ...base, visibility: "FOLLOWERS" }, { viewerId: "b", followsAuthor: true }), true);
    assert.equal(canViewPost({ ...base, visibility: "PRIVATE" }, { viewerId: "b", followsAuthor: true }), false);
  });

  it("não seguidor vê apenas PUBLIC", () => {
    const base = { authorId: "a", status: "PUBLISHED" as const };
    assert.equal(canViewPost({ ...base, visibility: "PUBLIC" }, { viewerId: "b", followsAuthor: false }), true);
    assert.equal(canViewPost({ ...base, visibility: "FOLLOWERS" }, { viewerId: "b", followsAuthor: false }), false);
    assert.equal(canViewPost({ ...base, visibility: "PRIVATE" }, { viewerId: "b", followsAuthor: false }), false);
  });

  it("guest vê apenas PUBLIC", () => {
    const base = { authorId: "a", status: "PUBLISHED" as const };
    assert.equal(canViewPost({ ...base, visibility: "PUBLIC" }, {}), true);
    assert.equal(canViewPost({ ...base, visibility: "FOLLOWERS" }, {}), false);
    assert.equal(canViewPost({ ...base, visibility: "PRIVATE" }, {}), false);
  });

  it("arquivado não aparece para terceiros", () => {
    assert.equal(
      canViewPost(
        { authorId: "a", visibility: "PUBLIC", status: "PUBLISHED", archivedAt: new Date() },
        { viewerId: "b" }
      ),
      false
    );
  });

  it("deleted só no trash do dono", () => {
    const post = { authorId: "a", visibility: "PUBLIC" as const, status: "PUBLISHED" as const, deletedAt: new Date() };
    assert.equal(canViewPost(post, { viewerId: "a" }), false);
    assert.equal(canViewPost(post, { viewerId: "a", includeOwnTrash: true }), true);
    assert.equal(canViewPost(post, { viewerId: "b", includeOwnTrash: true }), false);
    assert.equal(canViewPost(post, {}), false);
  });

  it("bloqueado não vê", () => {
    assert.equal(
      canViewPost(
        { authorId: "a", visibility: "PUBLIC", status: "PUBLISHED" },
        { viewerId: "b", isBlocked: true }
      ),
      false
    );
  });

  it("commentsEnabled=false impede comentário, mas o post continua visível", () => {
    const post = { authorId: "a", visibility: "PUBLIC" as const, status: "PUBLISHED" as const, commentsEnabled: false };
    assert.equal(canViewPost(post, { viewerId: "b" }), true);
    assert.equal(canCommentPost(post, { viewerId: "b" }), false);
  });

  it("limite de pins existente", () => {
    assert.equal(canPinPost(SOCIAL_MAX_PINNED_POSTS - 1, true), true);
    assert.equal(canPinPost(SOCIAL_MAX_PINNED_POSTS, true), false);
  });

  it("motivos de denúncia válidos", () => {
    assert.equal(isSocialReportReason("SPAM"), true);
    assert.equal(isSocialReportReason("SCAM"), true);
    assert.equal(isSocialReportReason("INVALID"), false);
  });
});
