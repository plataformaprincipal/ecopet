import { create } from "zustand";
import type { SocialPost, SocialStory, SocialReel, Conversation, ChatMessage } from "@/lib/social/types";
import {
  fetchSocialFeed,
  fetchStories,
  fetchReels,
  fetchAiSuggestions,
  fetchAiCommunity,
  fetchConversations,
  fetchMessages,
} from "@/lib/social/api";

interface SocialState {
  posts: SocialPost[];
  stories: SocialStory[];
  reels: SocialReel[];
  conversations: Conversation[];
  messages: ChatMessage[];
  activeConversationId: string | null;
  loading: boolean;
  loaded: boolean;
  feedIsDemo: boolean;
  conversationsIsDemo: boolean;
  likedIds: Set<string>;
  savedIds: Set<string>;
  followingIds: Set<string>;
  expandedCommentsPostId: string | null;
  pollVotes: Record<string, string>;

  resetForUser: () => void;
  loadFeed: (token?: string) => Promise<void>;
  loadStories: () => Promise<void>;
  loadReels: () => Promise<void>;
  loadConversations: (token?: string, userId?: string) => Promise<void>;
  loadMessages: (conversationId: string, token?: string, userId?: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  toggleFollow: (profileId: string) => void;
  isLiked: (postId: string) => boolean;
  isSaved: (postId: string) => boolean;
  isFollowing: (profileId: string) => boolean;
  setExpandedComments: (postId: string | null) => void;
  votePoll: (postId: string, optionId: string) => void;
  getLikeCount: (post: SocialPost) => number;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  posts: [],
  stories: [],
  reels: [],
  conversations: [],
  messages: [],
  activeConversationId: null,
  loading: false,
  loaded: false,
  feedIsDemo: false,
  conversationsIsDemo: false,
  likedIds: new Set(),
  savedIds: new Set(),
  followingIds: new Set(),
  expandedCommentsPostId: null,
  pollVotes: {},

  resetForUser: () =>
    set({
      posts: [],
      conversations: [],
      messages: [],
      loaded: false,
      likedIds: new Set(),
      savedIds: new Set(),
      followingIds: new Set(),
      feedIsDemo: false,
      conversationsIsDemo: false,
    }),

  loadFeed: async (token) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const { posts, isDemo } = await fetchSocialFeed(token);
      await Promise.all([fetchAiSuggestions(), fetchAiCommunity()]);
      set({ posts, loaded: true, feedIsDemo: isDemo });
    } finally {
      set({ loading: false });
    }
  },

  loadStories: async () => {
    const stories = await fetchStories();
    set({ stories });
  },

  loadReels: async () => {
    const reels = await fetchReels();
    set({ reels });
  },

  loadConversations: async (token, userId) => {
    const { items, isDemo } = await fetchConversations(token, userId);
    set({ conversations: items, conversationsIsDemo: isDemo });
  },

  loadMessages: async (conversationId, token, userId) => {
    const { items } = await fetchMessages(conversationId, token, userId);
    set({ messages: items, activeConversationId: conversationId });
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),

  toggleLike: (postId) =>
    set((s) => {
      const next = new Set(s.likedIds);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return { likedIds: next };
    }),

  toggleSave: (postId) =>
    set((s) => {
      const next = new Set(s.savedIds);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return { savedIds: next };
    }),

  toggleFollow: (profileId) =>
    set((s) => {
      const next = new Set(s.followingIds);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return { followingIds: next };
    }),

  isLiked: (postId) => get().likedIds.has(postId),
  isSaved: (postId) => get().savedIds.has(postId),
  isFollowing: (profileId) => get().followingIds.has(profileId),

  setExpandedComments: (postId) => set({ expandedCommentsPostId: postId }),

  votePoll: (postId, optionId) => set((s) => ({ pollVotes: { ...s.pollVotes, [postId]: optionId } })),

  getLikeCount: (post) => post.likes + (get().isLiked(post.id) ? 1 : 0),
}));
