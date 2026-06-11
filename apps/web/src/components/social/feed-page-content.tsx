"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/layout/app-header";
import { SocialSubNav } from "@/components/social/social-sub-nav";
import { StoriesBar } from "@/components/social/stories-bar";
import { AiSuggestionsBlock, AiCommunityBlock } from "@/components/social/ai-blocks";
import { FeedPostCard } from "@/components/social/feed-post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { DemoContentBanner, EmptyState } from "@/components/ui/empty-state";
import { EMPTY_MESSAGES } from "@/lib/auth/routes";
import { useSocialStore } from "@/store/social-store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { FileText } from "lucide-react";

export function FeedPageContent() {
  const { token } = useCurrentUser();
  const posts = useSocialStore((s) => s.posts);
  const stories = useSocialStore((s) => s.stories);
  const loading = useSocialStore((s) => s.loading);
  const loaded = useSocialStore((s) => s.loaded);
  const feedIsDemo = useSocialStore((s) => s.feedIsDemo);
  const loadFeed = useSocialStore((s) => s.loadFeed);
  const loadStories = useSocialStore((s) => s.loadStories);

  useEffect(() => {
    if (!loaded) loadFeed(token ?? undefined);
    loadStories();
  }, [loaded, loadFeed, loadStories, token]);

  return (
    <>
      <AppHeader title="Feed" />
      <SocialSubNav />
      <main className="mx-auto max-w-2xl flex-1 p-4 lg:p-6">
        {feedIsDemo && (
          <div className="mb-4">
            <DemoContentBanner />
          </div>
        )}

        {!loading && stories.length > 0 && <StoriesBar stories={stories} />}

        {!loading && (
          <div className="mb-4 space-y-4">
            <AiSuggestionsBlock />
            <AiCommunityBlock />
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-premium space-y-3 p-4">
                <Skeleton className="h-11 w-11 rounded-full" />
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Feed"
            description={EMPTY_MESSAGES.posts}
            demo={feedIsDemo}
          />
        ) : (
          posts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <FeedPostCard post={post} />
            </motion.div>
          ))
        )}
      </main>
    </>
  );
}
