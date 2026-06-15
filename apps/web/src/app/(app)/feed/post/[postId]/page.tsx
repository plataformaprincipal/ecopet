"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/layouts/app-header";
import { PostCard } from "@/components/features/social/feed/post-card";
import { fetchPost, type ApiSocialPost } from "@/lib/social/client-api";

export default function FeedPostPage() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<ApiSocialPost | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPost(postId)
      .then((d) => setPost(d.post))
      .catch((e) => setError(e.message));
  }, [postId]);

  return (
    <>
      <AppHeader title="Publicação" />
      <main className="mx-auto max-w-2xl flex-1 p-4">
        {error && <p className="text-red-600">{error}</p>}
        {post && <PostCard post={post} />}
      </main>
    </>
  );
}
