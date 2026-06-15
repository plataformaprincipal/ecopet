export type FeedRankingInput = {
  postId: string;
  createdAt: Date;
  likeCount: number;
  commentCount: number;
  shareCount: number;
};

export interface FeedRankingStrategy {
  readonly name: string;
  rank(posts: FeedRankingInput[]): FeedRankingInput[];
}
