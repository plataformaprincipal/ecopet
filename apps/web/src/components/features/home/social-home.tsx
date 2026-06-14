"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, FileText } from "lucide-react";
import { AppHeader } from "@/components/layouts/app-header";
import { StoriesBar } from "@/components/features/social/stories-bar";
import { FeedPostCard } from "@/components/features/social/feed-post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useSocialStore } from "@/store/social-store";
import { useFoundationSession } from "@/hooks/use-foundation-session";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "@/providers/i18n-provider";

export function SocialHome() {
  const { t } = useTranslation();
  const { user } = useFoundationSession();
  const posts = useSocialStore((s) => s.posts);
  const myPosts = posts.filter((p) => user && p.author.id === user.id);
  const stories = useSocialStore((s) => s.stories);
  const loading = useSocialStore((s) => s.loading);
  const loaded = useSocialStore((s) => s.loaded);
  const loadFeed = useSocialStore((s) => s.loadFeed);
  const loadStories = useSocialStore((s) => s.loadStories);

  useEffect(() => {
    if (!loaded) loadFeed(undefined);
    loadStories();
  }, [loaded, loadFeed, loadStories]);

  const communityPosts = posts.filter((p) => !user || p.author.id !== user.id);

  return (
    <>
      <AppHeader title="ECOPET" />
      <main className="mx-auto max-w-2xl flex-1 pb-4">
        {!loading && stories.length > 0 && (
          <div className="border-b border-ecopet-gray/10 px-4 py-3">
            <StoriesBar stories={stories} />
          </div>
        )}

        <div className="space-y-4 p-4">
          {user && myPosts.length === 0 && !loading && (
            <EmptyState
              icon={FileText}
              title={t("empty.posts.myTitle")}
              description={t("empty.posts.myDescription")}
              actionLabel={t("empty.posts.exploreAction")}
              actionHref="/explorar"
            />
          )}

          <h2 className="section-title">{t("empty.posts.communityTitle")}</h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="space-y-3 p-4">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <Skeleton className="aspect-square w-full rounded-2xl" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : communityPosts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={t("empty.posts.title")}
              description={t("empty.posts.description")}
            />
          ) : (
            communityPosts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <FeedPostCard post={post} />
              </motion.div>
            ))
          )}
        </div>

        <Link
          href="/feed"
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ecopet-green text-white shadow-lg transition-transform hover:scale-105 lg:bottom-8"
          aria-label={t("empty.posts.createLabel")}
        >
          <Plus className="h-6 w-6" />
        </Link>
      </main>
    </>
  );
}
