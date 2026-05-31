import type {
  SocialPost,
  SocialProfile,
  SocialStory,
  SocialReel,
  SocialComment,
  TrendTag,
  AiSuggestion,
  AiCommunityInsight,
  Conversation,
  ChatMessage,
  ExploreSection,
} from "./types";
import {
  MOCK_POSTS,
  MOCK_PROFILES,
  MOCK_STORIES,
  MOCK_REELS,
  MOCK_COMMENTS,
  MOCK_TRENDS,
  MOCK_AI_SUGGESTIONS,
  MOCK_AI_COMMUNITY,
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_EXPLORE_SECTIONS,
  getPostById,
  getProfileById,
  getCommentsByPostId,
  getPostsByProfileId,
  getReelsByProfileId,
} from "./mock-data";

const DELAY = 600;

async function delay<T>(data: T): Promise<T> {
  await new Promise((r) => setTimeout(r, DELAY));
  return data;
}

/** Futuro: GET /api/social/feed */
export async function fetchSocialFeed(_token?: string): Promise<SocialPost[]> {
  return delay([...MOCK_POSTS]);
}

/** Futuro: GET /api/social/profiles/:id */
export async function fetchProfile(id: string): Promise<SocialProfile | undefined> {
  return delay(getProfileById(id));
}

/** Futuro: GET /api/social/posts/:id */
export async function fetchPost(id: string): Promise<SocialPost | undefined> {
  return delay(getPostById(id));
}

/** Futuro: GET /api/social/posts/:id/comments */
export async function fetchComments(postId: string): Promise<SocialComment[]> {
  return delay(getCommentsByPostId(postId));
}

/** Futuro: GET /api/social/stories */
export async function fetchStories(): Promise<SocialStory[]> {
  return delay([...MOCK_STORIES]);
}

/** Futuro: GET /api/social/reels */
export async function fetchReels(): Promise<SocialReel[]> {
  return delay([...MOCK_REELS]);
}

/** Futuro: GET /api/social/trends */
export async function fetchTrends(): Promise<TrendTag[]> {
  return delay([...MOCK_TRENDS]);
}

/** Futuro: GET /api/social/ai/suggestions */
export async function fetchAiSuggestions(): Promise<AiSuggestion[]> {
  return delay([...MOCK_AI_SUGGESTIONS]);
}

/** Futuro: GET /api/social/ai/community */
export async function fetchAiCommunity(): Promise<AiCommunityInsight[]> {
  return delay([...MOCK_AI_COMMUNITY]);
}

/** Futuro: GET /api/social/conversations */
export async function fetchConversations(): Promise<Conversation[]> {
  return delay([...MOCK_CONVERSATIONS]);
}

/** Futuro: GET /api/social/conversations/:id/messages */
export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  return delay(MOCK_MESSAGES.filter((m) => m.conversationId === conversationId));
}

/** Futuro: GET /api/social/explore */
export async function fetchExploreSections(): Promise<ExploreSection[]> {
  return delay([...MOCK_EXPLORE_SECTIONS]);
}

/** Futuro: GET /api/social/profiles/:id/posts */
export async function fetchProfilePosts(profileId: string): Promise<SocialPost[]> {
  return delay(getPostsByProfileId(profileId));
}

/** Futuro: GET /api/social/profiles/:id/reels */
export async function fetchProfileReels(profileId: string): Promise<SocialReel[]> {
  return delay(getReelsByProfileId(profileId));
}

/** Futuro: GET /api/social/saved */
export async function fetchSavedPosts(ids: string[]): Promise<SocialPost[]> {
  return delay(MOCK_POSTS.filter((p) => ids.includes(p.id)));
}

export { MOCK_PROFILES, MOCK_POSTS, MOCK_STORIES, MOCK_REELS, MOCK_COMMENTS };
