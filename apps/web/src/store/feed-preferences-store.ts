"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type FeedPreferencesState = {
  hiddenPostIds: string[];
  notInterestedAuthorIds: string[];
  hidePost: (postId: string) => void;
  unhidePost: (postId: string) => void;
  markNotInterestedAuthor: (authorId: string) => void;
  isHidden: (postId: string) => boolean;
  isNotInterestedAuthor: (authorId: string) => boolean;
};

export const useFeedPreferencesStore = create<FeedPreferencesState>()(
  persist(
    (set, get) => ({
      hiddenPostIds: [],
      notInterestedAuthorIds: [],
      hidePost: (postId) =>
        set((s) =>
          s.hiddenPostIds.includes(postId)
            ? s
            : { hiddenPostIds: [...s.hiddenPostIds, postId] }
        ),
      unhidePost: (postId) =>
        set((s) => ({ hiddenPostIds: s.hiddenPostIds.filter((id) => id !== postId) })),
      markNotInterestedAuthor: (authorId) =>
        set((s) =>
          s.notInterestedAuthorIds.includes(authorId)
            ? s
            : { notInterestedAuthorIds: [...s.notInterestedAuthorIds, authorId] }
        ),
      isHidden: (postId) => get().hiddenPostIds.includes(postId),
      isNotInterestedAuthor: (authorId) => get().notInterestedAuthorIds.includes(authorId),
    }),
    { name: "ecopet-feed-prefs-v1" }
  )
);
