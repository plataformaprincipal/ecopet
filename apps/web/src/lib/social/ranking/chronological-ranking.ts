import type { FeedRankingInput, FeedRankingStrategy } from "./feed-ranking.types";

/** Feed padrão cronológico — sem algoritmo de recomendação. */
export const chronologicalRanking: FeedRankingStrategy = {
  name: "chronological",
  rank(posts: FeedRankingInput[]) {
    return [...posts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
};
