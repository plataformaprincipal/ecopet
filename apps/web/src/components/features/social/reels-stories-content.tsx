"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppHeader } from "@/components/layouts/app-header";
import { SocialSubNav } from "@/components/features/social/social-sub-nav";
import { ReelsViewer } from "@/components/features/social/reels-viewer";
import { useSocialStore } from "@/store/social-store";
import { Skeleton } from "@/components/ui/skeleton";

export function ReelsPageContent() {
  const reels = useSocialStore((s) => s.reels);
  const loadReels = useSocialStore((s) => s.loadReels);
  const loading = useSocialStore((s) => s.loading);

  useEffect(() => {
    if (reels.length === 0) loadReels();
  }, [reels.length, loadReels]);

  return (
    <>
      <AppHeader title="Reels" />
      <SocialSubNav />
      <main className="mx-auto max-w-lg flex-1">
        {reels.length === 0 && loading ? (
          <Skeleton className="mx-4 h-[70vh] rounded-2xl" />
        ) : (
          <ReelsViewer reels={reels} />
        )}
      </main>
    </>
  );
}

export function StoriesPageContent() {
  const stories = useSocialStore((s) => s.stories);
  const loadStories = useSocialStore((s) => s.loadStories);

  useEffect(() => {
    if (stories.length === 0) loadStories();
  }, [stories.length, loadStories]);

  return (
    <>
      <AppHeader title="Stories" />
      <SocialSubNav />
      <main className="mx-auto max-w-2xl flex-1 p-4 lg:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stories.map((story) => (
            <div key={story.id} className="overflow-hidden rounded-2xl border border-ecopet-gray/10">
              <div className="relative aspect-[9/16]">
                <Image src={story.media.url} alt={story.profile.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
                  <div className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-ecopet-green">
                    <Image src={story.profile.avatar} alt="" fill className="object-cover" />
                  </div>
                  <span className="text-sm font-semibold">{story.profile.name}</span>
                </div>
                {story.isAdoption && (
                  <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">Adoção</span>
                )}
                {story.isSponsored && (
                  <span className="absolute left-3 top-3 rounded-full bg-ecopet-yellow px-2 py-0.5 text-[10px] font-bold text-ecopet-dark">Patrocinado</span>
                )}
              </div>
              <div className="flex gap-2 p-3">
                <button type="button" className="flex-1 rounded-lg bg-ecopet-green/10 py-2 text-xs font-semibold text-ecopet-green">❤️ Reagir</button>
                <button type="button" className="flex-1 rounded-lg bg-ecopet-gray/10 py-2 text-xs font-semibold">💬 Responder</button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-ecopet-gray">
          <Link href="/feed" className="text-ecopet-green hover:underline">Voltar ao feed</Link>
        </p>
      </main>
    </>
  );
}
