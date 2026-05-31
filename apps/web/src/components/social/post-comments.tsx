"use client";

import Image from "next/image";
import { Heart, Sparkles, Languages, Smile } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCommentsByPostId } from "@/lib/social/mock-data";
import { formatSocialTime } from "@/lib/social/config";

interface PostCommentsProps {
  postId: string;
}

const AI_REPLY_SUGGESTIONS = [
  "Adorei! 🐾",
  "Muito obrigado pela dica!",
  "Concordo totalmente!",
];

export function PostComments({ postId }: PostCommentsProps) {
  const comments = getCommentsByPostId(postId);

  return (
    <div className="border-t bg-ecopet-gray/[0.02] px-4 py-3 dark:bg-white/[0.02]">
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase text-violet-600">
          <Sparkles className="h-3 w-3" /> Respostas sugeridas pela IA
        </span>
        {AI_REPLY_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1 text-xs text-violet-700 dark:text-violet-300"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id}>
            <div className="flex gap-2">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
                <Image src={comment.author.avatar} alt="" fill className="object-cover" />
              </div>
              <div className="flex-1">
                <div className="rounded-2xl bg-white px-3 py-2 shadow-sm dark:bg-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold">{comment.author.name}</span>
                    {comment.author.isVerified && <Badge variant="verified" className="px-1 py-0 text-[8px]">✓</Badge>}
                    {comment.aiSuggested && (
                      <Badge className="bg-violet-500/10 px-1 py-0 text-[8px] text-violet-600">IA</Badge>
                    )}
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
                <div className="mt-1 flex items-center gap-3 px-2 text-[11px] text-ecopet-gray">
                  <span>{formatSocialTime(comment.createdAt)}</span>
                  <button type="button" className="flex items-center gap-0.5 hover:text-rose-500">
                    <Heart className="h-3 w-3" /> {comment.likes}
                  </button>
                  <button type="button" className="hover:text-ecopet-green">Responder</button>
                  <button type="button" className="flex items-center gap-0.5 hover:text-ecopet-green">
                    <Languages className="h-3 w-3" /> Traduzir
                  </button>
                </div>
                {comment.replies?.map((reply) => (
                  <div key={reply.id} className="ml-6 mt-3 flex gap-2">
                    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
                      <Image src={reply.author.avatar} alt="" fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="rounded-2xl bg-ecopet-green/5 px-3 py-2">
                        <span className="text-xs font-semibold">{reply.author.name}</span>
                        <p className="text-sm">{reply.content}</p>
                      </div>
                      <div className="mt-1 flex gap-3 px-2 text-[11px] text-ecopet-gray">
                        <span>{formatSocialTime(reply.createdAt)}</span>
                        <button type="button" className="hover:text-rose-500">Curtir</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-ecopet-green/20" />
        <div className="flex flex-1 items-center gap-2 rounded-full border border-ecopet-gray/15 bg-white px-4 py-2 dark:bg-white/5">
          <input
            type="text"
            placeholder="Adicionar comentário..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <Smile className="h-5 w-5 text-ecopet-gray" />
        </div>
      </div>
    </div>
  );
}
