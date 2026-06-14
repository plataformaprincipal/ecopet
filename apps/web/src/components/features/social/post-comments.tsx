"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { fetchComments } from "@/lib/social/api";
import type { SocialComment } from "@/lib/social/types";
import { formatSocialTime } from "@/lib/social/config";
import { useTranslation } from "@/providers/i18n-provider";

interface PostCommentsProps {
  postId: string;
}

export function PostComments({ postId }: PostCommentsProps) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<SocialComment[]>([]);

  useEffect(() => {
    fetchComments(postId).then(setComments);
  }, [postId]);

  if (comments.length === 0) {
    return (
      <div className="border-t bg-ecopet-gray/[0.02] px-4 py-3 text-center text-xs text-ecopet-gray dark:bg-white/[0.02]">
        {t("empty.comments.description")}
      </div>
    );
  }

  return (
    <div className="border-t bg-ecopet-gray/[0.02] px-4 py-3 dark:bg-white/[0.02]">
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
              <Image src={comment.author.avatar || "/icon.png"} alt="" width={32} height={32} className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{comment.author.name}</span>
                <span className="text-[10px] text-ecopet-gray">{formatSocialTime(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-ecopet-gray">{comment.content}</p>
              <button type="button" className="mt-1 flex items-center gap-1 text-[10px] text-ecopet-gray">
                <Heart className="h-3 w-3" /> {comment.likes}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
