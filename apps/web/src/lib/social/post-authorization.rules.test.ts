import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * Regras de autorização social espelhadas do serviço (sem I/O).
 */
function canUpdatePost(actorId: string, authorId: string) {
  return actorId === authorId;
}

function canDeletePost(actorId: string, authorId: string, isAdmin: boolean) {
  return isAdmin || actorId === authorId;
}

function isVisibleToViewer(opts: {
  visibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
  authorId: string;
  viewerId?: string;
  followsAuthor?: boolean;
  archivedAt?: Date | null;
}) {
  if (opts.archivedAt) return opts.viewerId === opts.authorId;
  if (!opts.viewerId) return opts.visibility === "PUBLIC";
  if (opts.viewerId === opts.authorId) return true;
  if (opts.visibility === "PRIVATE") return false;
  if (opts.visibility === "FOLLOWERS") return Boolean(opts.followsAuthor);
  return true;
}

function canComment(commentsEnabled: boolean, archivedAt?: Date | null) {
  return commentsEnabled !== false && !archivedAt;
}

function canPin(alreadyPinnedOther: number, pinning: boolean) {
  if (!pinning) return true;
  return alreadyPinnedOther < 3;
}

describe("social authorization rules", () => {
  it("proprietário pode alterar; terceiro não", () => {
    assert.equal(canUpdatePost("a", "a"), true);
    assert.equal(canUpdatePost("b", "a"), false);
  });

  it("não autorizado não exclui; admin pode", () => {
    assert.equal(canDeletePost("b", "a", false), false);
    assert.equal(canDeletePost("a", "a", false), true);
    assert.equal(canDeletePost("admin", "a", true), true);
  });

  it("archived não aparece no feed de terceiros", () => {
    assert.equal(
      isVisibleToViewer({
        visibility: "PUBLIC",
        authorId: "a",
        viewerId: "b",
        archivedAt: new Date(),
      }),
      false
    );
    assert.equal(
      isVisibleToViewer({
        visibility: "PUBLIC",
        authorId: "a",
        viewerId: "a",
        archivedAt: new Date(),
      }),
      true
    );
  });

  it("PRIVATE não aparece para terceiros", () => {
    assert.equal(
      isVisibleToViewer({ visibility: "PRIVATE", authorId: "a", viewerId: "b" }),
      false
    );
  });

  it("FOLLOWERS respeita relação", () => {
    assert.equal(
      isVisibleToViewer({
        visibility: "FOLLOWERS",
        authorId: "a",
        viewerId: "b",
        followsAuthor: false,
      }),
      false
    );
    assert.equal(
      isVisibleToViewer({
        visibility: "FOLLOWERS",
        authorId: "a",
        viewerId: "b",
        followsAuthor: true,
      }),
      true
    );
  });

  it("commentsEnabled=false impede comentário", () => {
    assert.equal(canComment(false), false);
    assert.equal(canComment(true), true);
    assert.equal(canComment(true, new Date()), false);
  });

  it("limite de 3 pins", () => {
    assert.equal(canPin(2, true), true);
    assert.equal(canPin(3, true), false);
  });
});
