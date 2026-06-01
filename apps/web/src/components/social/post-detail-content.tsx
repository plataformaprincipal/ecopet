"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { FeedPostCard } from "@/components/social/feed-post-card";
import { fetchPost } from "@/lib/social/api";
import type { SocialPost } from "@/lib/social/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface PostDetailContentProps {
  postId: string;
}

export function PostDetailContent({ postId }: PostDetailContentProps) {
  const [post, setPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost(postId).then((p) => setPost(p ?? null)).finally(() => setLoading(false));
  }, [postId]);

  return (
    <>
      <AppHeader title="Publicação" />
      <main className="mx-auto max-w-2xl flex-1 p-4 lg:p-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/feed"><ArrowLeft className="h-4 w-4" /> Voltar ao feed</Link>
        </Button>
        {loading ? (
          <Skeleton className="aspect-square w-full rounded-2xl" />
        ) : post ? (
          <FeedPostCard post={post} showCommentsDefault />
        ) : (
          <p className="text-center text-ecopet-gray">Publicação não encontrada</p>
        )}
      </main>
    </>
  );
}
