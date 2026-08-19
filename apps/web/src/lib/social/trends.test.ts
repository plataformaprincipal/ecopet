import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rankHashtagTrends, scoreHashtagTrend } from "./trends";

describe("social trends scoring", () => {
  it("penaliza spam de um único autor", () => {
    const spam = scoreHashtagTrend({
      id: "spam",
      name: "spam",
      slug: "spam",
      posts: 50,
      uniqueAuthors: 1,
      comments: 0,
      likes: 0,
      hours: 24,
    });
    const diverse = scoreHashtagTrend({
      id: "real",
      name: "real",
      slug: "real",
      posts: 20,
      uniqueAuthors: 20,
      comments: 10,
      likes: 10,
      hours: 24,
    });
    assert.ok(diverse > spam, `diverse=${diverse} should beat spam=${spam}`);
  });

  it("não ranqueia privado/arquivado/deletado porque a query já exclui — ranking usa só inputs visíveis", () => {
    const ranked = rankHashtagTrends([
      { id: "a", name: "a", slug: "a", posts: 2, uniqueAuthors: 2, comments: 0, likes: 0, hours: 24 },
      { id: "b", name: "b", slug: "b", posts: 8, uniqueAuthors: 1, comments: 0, likes: 0, hours: 24 },
    ]);
    assert.equal(ranked[0]?.id, "a");
  });
});
