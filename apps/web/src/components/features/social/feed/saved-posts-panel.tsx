"use client";

import { useEffect, useState } from "react";
import { PostCard } from "./post-card";
import { fetchSavedPosts, type ApiSocialPost } from "@/lib/social/client-api";
import { EmptyState } from "@/components/ui/empty-state";
import { Bookmark } from "lucide-react";

export function SavedPostsPanel() {
  const [posts, setPosts] = useState<ApiSocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedPosts()
      .then((d) => setPosts(d.posts))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!posts.length) return <EmptyState icon={Bookmark} title="Nenhum salvo" description="Salve publicações para ver aqui." />;

  return (
    <div className="space-y-4">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}
