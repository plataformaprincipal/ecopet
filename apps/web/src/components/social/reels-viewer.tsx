"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Share2, Bookmark, Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import type { SocialReel } from "@/lib/social/types";
import { formatCount } from "@/lib/social/config";
import { useSocialStore } from "@/store/social-store";
import { cn } from "@/lib/utils";

interface ReelsViewerProps {
  reels: SocialReel[];
}

export function ReelsViewer({ reels }: ReelsViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleLike = useSocialStore((s) => s.toggleLike);
  const toggleSave = useSocialStore((s) => s.toggleSave);
  const isLiked = useSocialStore((s) => s.isLiked);
  const isSaved = useSocialStore((s) => s.isSaved);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setActiveIndex(idx);
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (idx: number) => {
    containerRef.current?.scrollTo({ top: idx * (containerRef.current?.clientHeight ?? 0), behavior: "smooth" });
  };

  return (
    <div className="relative h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
      <div ref={containerRef} className="h-full snap-y snap-mandatory overflow-y-scroll scrollbar-none">
        {reels.map((reel) => (
          <div key={reel.id} className="relative flex h-full snap-start items-center justify-center bg-black">
            <Image src={reel.thumbnail} alt="" fill className="object-cover opacity-90" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

            {reel.aiRecommended && (
              <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-violet-500/90 px-3 py-1.5 text-xs font-semibold text-white">
                <Sparkles className="h-3.5 w-3.5" />
                IA: {reel.aiReason}
              </div>
            )}

            <div className="absolute bottom-20 left-4 right-16 text-white">
              <Link href={`/social/perfil/${reel.author.id}`} className="flex items-center gap-2">
                <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white">
                  <Image src={reel.author.avatar} alt="" fill className="object-cover" />
                </div>
                <span className="font-semibold">{reel.author.name}</span>
              </Link>
              <p className="mt-2 text-sm">{reel.caption}</p>
              <p className="mt-1 text-xs text-white/70">{reel.hashtags.map((h) => `#${h}`).join(" ")}</p>
            </div>

            <div className="absolute bottom-24 right-3 flex flex-col items-center gap-5">
              {[
                { icon: Heart, count: reel.likes, active: isLiked(reel.id), action: () => toggleLike(reel.id), fill: true },
                { icon: MessageCircle, count: reel.commentsCount, href: `/social/post/${reel.id}` },
                { icon: Share2, count: reel.shares },
                { icon: Bookmark, count: 0, active: isSaved(reel.id), action: () => toggleSave(reel.id), fill: true },
              ].map(({ icon: Icon, count, active, action, fill, href }, i) =>
                href ? (
                  <Link key={i} href={href} className="flex flex-col items-center text-white">
                    <Icon className="h-7 w-7" />
                    <span className="text-[10px]">{formatCount(count)}</span>
                  </Link>
                ) : (
                  <button key={i} type="button" onClick={action} className="flex flex-col items-center text-white">
                    <Icon className={cn("h-7 w-7", active && fill && "fill-rose-500 text-rose-500")} />
                    <span className="text-[10px]">{formatCount(count)}</span>
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-2 lg:flex">
        <button type="button" onClick={() => scrollTo(Math.max(0, activeIndex - 1))} className="rounded-full bg-black/40 p-2 text-white">
          <ChevronUp className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => scrollTo(Math.min(reels.length - 1, activeIndex + 1))} className="rounded-full bg-black/40 p-2 text-white">
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
