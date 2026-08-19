export type HashtagTrendInput = {
  id: string;
  name: string;
  slug: string;
  posts: number;
  uniqueAuthors: number;
  comments: number;
  likes: number;
  hours: number;
};

export type RankedHashtagTrend = HashtagTrendInput & {
  trendScore: number;
};

/**
 * Score determinístico de tendência.
 * Prioriza autores únicos e penaliza spam de um único autor.
 */
export function scoreHashtagTrend(input: HashtagTrendInput): number {
  const posts = Math.max(0, input.posts);
  const uniqueAuthors = Math.max(0, input.uniqueAuthors);
  const hours = Math.max(input.hours, 1);

  const authorPenalty = uniqueAuthors <= 1 ? 0.12 : uniqueAuthors < 3 ? 0.4 : uniqueAuthors < 8 ? 0.75 : 1;
  const diversity = uniqueAuthors / Math.max(posts, 1);
  const velocity = (posts + input.comments * 0.5 + input.likes * 0.15) / hours;

  const base =
    uniqueAuthors * 10 +
    posts * 1.5 +
    input.comments * 2 +
    input.likes * 1 +
    velocity * 6;

  return Number((base * authorPenalty * (0.35 + 0.65 * Math.min(diversity, 1))).toFixed(4));
}

export function rankHashtagTrends(items: HashtagTrendInput[]): RankedHashtagTrend[] {
  return items
    .map((item) => ({ ...item, trendScore: scoreHashtagTrend(item) }))
    .sort((a, b) => b.trendScore - a.trendScore || b.uniqueAuthors - a.uniqueAuthors || b.posts - a.posts);
}

export function formatTrendCount(n: number): string {
  if (n >= 1000) {
    const v = n / 1000;
    return `${v.toFixed(v >= 10 ? 0 : 1).replace(".", ",")} mil`;
  }
  return String(n);
}
