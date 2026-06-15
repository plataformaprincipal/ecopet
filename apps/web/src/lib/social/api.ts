import type { SocialPost, Conversation, ChatMessage, SocialProfile, SocialComment, SocialStory, SocialReel, TrendTag, AiSuggestion, AiCommunityInsight, ExploreSection } from "./types";
import { api } from "@/lib/api";
import type { ApiSocialPost } from "./client-api";

function mapSocialPostToLegacy(post: ApiSocialPost): SocialPost {
  return {
    id: post.id,
    type: "photo",
    author: {
      id: post.author.id,
      type: "tutor",
      name: post.author.name,
      username: post.author.name.toLowerCase().replace(/\s+/g, ""),
      avatar: post.author.avatarUrl ?? "",
      bio: "",
      location: post.locationText ?? "",
      isVerified: false,
      followers: 0,
      following: 0,
      badges: [],
    },
    pet: post.pet
      ? { id: post.pet.id, name: post.pet.name, avatar: post.pet.photo ?? "" }
      : undefined,
    createdAt: post.createdAt,
    caption: post.content ?? "",
    hashtags: post.hashtags.map((h) => h.name),
    media: post.media.map((m) => ({ url: m.fileUrl, type: m.mediaType === "VIDEO" ? "video" : "image" })),
    likes: post.counts.likes,
    commentsCount: post.counts.comments,
    shares: post.counts.shares,
    saves: post.counts.saves,
  };
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
      avatar: post.author.avatar ?? "",
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
      avatar: other?.avatar ?? "",
      isVerified: true,
      type: other?.role === "GESTOR" ? "provider" : "tutor",
    },
    lastMessage: last?.content ?? "",
    lastMessageAt: last?.createdAt ?? conv.updatedAt,
    unread: 0,
    online: false,
  };
}

type ApiMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; avatar: string | null; role: string };
};

export async function fetchSocialFeed(_token?: string): Promise<{ posts: SocialPost[]; isDemo: boolean }> {
  try {
    const { fetchFeed } = await import("./client-api");
    const data = await fetchFeed();
    return { posts: data.posts.map(mapSocialPostToLegacy), isDemo: false };
  } catch {
    return { posts: [], isDemo: false };
  }
}

export async function fetchMyPosts(token: string, userId: string): Promise<SocialPost[]> {
  try {
    const { posts } = await fetchSocialFeed(token);
    return posts.filter((p) => p.author.id === userId);
  } catch {
    return [];
  }
}

export async function fetchProfile(_id: string): Promise<SocialProfile | undefined> {
  return undefined;
}

export async function fetchPost(id: string, _token?: string): Promise<SocialPost | undefined> {
  try {
    const { fetchPost: fetchSocialPost } = await import("./client-api");
    const data = await fetchSocialPost(id);
    return mapSocialPostToLegacy(data.post);
  } catch {
    return undefined;
  }
}

export async function fetchComments(_postId: string, _token?: string): Promise<SocialComment[]> {
  return [];
}

export async function fetchStories(): Promise<SocialStory[]> {
  return [];
}

export async function fetchReels(): Promise<SocialReel[]> {
  return [];
}

export async function fetchTrends(): Promise<TrendTag[]> {
  return [];
}

export async function fetchAiSuggestions(): Promise<AiSuggestion[]> {
  return [];
}

export async function fetchAiCommunity(): Promise<AiCommunityInsight[]> {
  return [];
}

export async function fetchConversations(token?: string, userId?: string): Promise<{ items: Conversation[]; isDemo: boolean }> {
  if (!userId) return { items: [], isDemo: false };
  try {
    const rows = await api<ApiConversation[]>("/api/conversations", token ? { token } : undefined);
    return { items: rows.map((c) => mapApiConversation(c, userId)), isDemo: false };
  } catch {
    return { items: [], isDemo: false };
  }
}

export async function fetchMessages(conversationId: string, token?: string, userId?: string): Promise<{ items: ChatMessage[]; isDemo: boolean }> {
  if (!userId) return { items: [], isDemo: false };
  try {
    const rows = await api<ApiMessage[]>(
      `/api/conversations/${conversationId}/messages`,
      token ? { token } : undefined
    );
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
    return { items: [], isDemo: false };
  }
}

export async function fetchExploreSections(): Promise<ExploreSection[]> {
  return [];
}

export async function fetchProfilePosts(_profileId: string): Promise<SocialPost[]> {
  return [];
}

export async function fetchProfileReels(_profileId: string): Promise<SocialReel[]> {
  return [];
}

export async function fetchSavedPosts(_ids: string[]): Promise<SocialPost[]> {
  return [];
}
