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
  likedIds: Set<string>;
  savedIds: Set<string>;
  followingIds: Set<string>;
  expandedCommentsPostId: string | null;
  pollVotes: Record<string, string>;

  loadFeed: () => Promise<void>;
  loadStories: () => Promise<void>;
  loadReels: () => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
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
  likedIds: new Set(),
  savedIds: new Set(["post1", "post4", "post6"]),
  followingIds: new Set(["p3", "p6"]),
  expandedCommentsPostId: null,
  pollVotes: {},

  loadFeed: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const [posts] = await Promise.all([
        fetchSocialFeed(),
        fetchAiSuggestions(),
        fetchAiCommunity(),
      ]);
      set({ posts, loaded: true });
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

  loadConversations: async () => {
    const conversations = await fetchConversations();
    set({ conversations });
  },

  loadMessages: async (conversationId) => {
    const messages = await fetchMessages(conversationId);
    set({ messages, activeConversationId: conversationId });
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
