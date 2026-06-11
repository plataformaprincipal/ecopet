import type { SocialPost, Conversation, ChatMessage } from "./types";
import { api } from "@/lib/api";
import {
  MOCK_POSTS,
  MOCK_STORIES,
  MOCK_REELS,
  MOCK_AI_SUGGESTIONS,
  MOCK_AI_COMMUNITY,
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_EXPLORE_SECTIONS,
  MOCK_TRENDS,
  getPostById,
  getProfileById,
  getCommentsByPostId,
  getPostsByProfileId,
  getReelsByProfileId,
} from "./mock-data";

const DELAY = 400;

async function delay<T>(data: T): Promise<T> {
  await new Promise((r) => setTimeout(r, DELAY));
  return data;
}

type ApiFeedPost = {
  id: string;
  type: string;
  content: string | null;
  mediaUrls: string[];
  createdAt: string;
  shares: number;
  author: { id: string; name: string; avatar: string | null; isVerified: boolean };
  pet?: { id: string; name: string; photo: string | null } | null;
  _count?: { likes: number; comments: number };
  hashtags?: { hashtag: { tag: string } }[];
};

function mapApiPostToSocial(post: ApiFeedPost): SocialPost {
  const mediaUrls = post.mediaUrls ?? [];
  return {
    id: post.id,
    type: (post.type?.toLowerCase() as SocialPost["type"]) || "photo",
    author: {
      id: post.author.id,
      type: "tutor",
      name: post.author.name,
      username: post.author.name.toLowerCase().replace(/\s+/g, ""),
      avatar: post.author.avatar ?? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
      bio: "",
      location: "",
      isVerified: post.author.isVerified,
      followers: 0,
      following: 0,
      badges: [],
    },
    pet: post.pet
      ? {
          id: post.pet.id,
          name: post.pet.name,
          avatar: post.pet.photo ?? "",
        }
      : undefined,
    createdAt: post.createdAt,
    caption: post.content ?? "",
    hashtags: post.hashtags?.map((h) => h.hashtag.tag) ?? [],
    media: mediaUrls.map((url) => ({ url, type: "image" as const })),
    likes: post._count?.likes ?? 0,
    commentsCount: post._count?.comments ?? 0,
    shares: post.shares ?? 0,
    saves: 0,
  };
}

type ApiConversation = {
  id: string;
  title: string | null;
  type: string;
  updatedAt: string;
  participants: { user: { id: string; name: string; avatar: string | null; role: string } }[];
  messages: { content: string; createdAt: string; sender: { id: string; name: string } }[];
};

function mapApiConversation(conv: ApiConversation, userId: string): Conversation {
  const other = conv.participants.find((p) => p.user.id !== userId)?.user ?? conv.participants[0]?.user;
  const last = conv.messages[0];
  return {
    id: conv.id,
    participant: {
      id: other?.id ?? "system",
      name: conv.title ?? other?.name ?? "Suporte ECOPET",
      avatar: other?.avatar ?? "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=200",
      isVerified: true,
      type: other?.role === "GESTOR" ? "provider" : "tutor",
    },
    lastMessage: last?.content ?? "",
    lastMessageAt: last?.createdAt ?? conv.updatedAt,
    unread: 0,
    online: true,
  };
}

type ApiMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; avatar: string | null; role: string };
};

export async function fetchSocialFeed(token?: string): Promise<{ posts: SocialPost[]; isDemo: boolean }> {
  if (token) {
    try {
      const rows = await api<ApiFeedPost[]>("/api/posts/feed", { token });
      return { posts: rows.map(mapApiPostToSocial), isDemo: false };
    } catch {
      /* fallback demo */
    }
  }
  const posts = await delay([...MOCK_POSTS]);
  return { posts, isDemo: true };
}

/** Posts do usuário autenticado (perfil). */
export async function fetchMyPosts(token: string, userId: string): Promise<SocialPost[]> {
  try {
    const { posts } = await fetchSocialFeed(token);
    return posts.filter((p) => p.author.id === userId);
  } catch {
    return [];
  }
}

export async function fetchProfile(id: string) {
  return delay(getProfileById(id));
}

export async function fetchPost(id: string) {
  return delay(getPostById(id));
}

export async function fetchComments(postId: string) {
  return delay(getCommentsByPostId(postId));
}

export async function fetchStories() {
  return delay([...MOCK_STORIES]);
}

export async function fetchReels() {
  return delay([...MOCK_REELS]);
}

export async function fetchTrends() {
  return delay([...MOCK_TRENDS]);
}

export async function fetchAiSuggestions() {
  return delay([...MOCK_AI_SUGGESTIONS]);
}

export async function fetchAiCommunity() {
  return delay([...MOCK_AI_COMMUNITY]);
}

export async function fetchConversations(token?: string, userId?: string): Promise<{ items: Conversation[]; isDemo: boolean }> {
  if (token && userId) {
    try {
      const rows = await api<ApiConversation[]>("/api/conversations", { token });
      return { items: rows.map((c) => mapApiConversation(c, userId)), isDemo: false };
    } catch {
      /* fallback */
    }
  }
  return { items: await delay([...MOCK_CONVERSATIONS]), isDemo: true };
}

export async function fetchMessages(conversationId: string, token?: string, userId?: string): Promise<{ items: ChatMessage[]; isDemo: boolean }> {
  if (token && userId) {
    try {
      const rows = await api<ApiMessage[]>(`/api/conversations/${conversationId}/messages`, { token });
      return {
        items: rows.map((m) => ({
          id: m.id,
          conversationId,
          senderId: m.sender.id,
          content: m.content,
          createdAt: m.createdAt,
          isMine: m.sender.id === userId,
          type: "text",
        })),
        isDemo: false,
      };
    } catch {
      /* fallback */
    }
  }
  return {
    items: await delay(MOCK_MESSAGES.filter((m) => m.conversationId === conversationId)),
    isDemo: true,
  };
}

export async function fetchExploreSections() {
  return delay([...MOCK_EXPLORE_SECTIONS]);
}

export async function fetchProfilePosts(profileId: string) {
  return delay(getPostsByProfileId(profileId));
}

export async function fetchProfileReels(profileId: string) {
  return delay(getReelsByProfileId(profileId));
}

export async function fetchSavedPosts(ids: string[]) {
  return delay(MOCK_POSTS.filter((p) => ids.includes(p.id)));
}

export { MOCK_PROFILES, MOCK_POSTS, MOCK_STORIES, MOCK_REELS, MOCK_COMMENTS } from "./mock-data";
