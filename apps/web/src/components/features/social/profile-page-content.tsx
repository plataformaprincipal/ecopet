"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AppHeader } from "@/components/layouts/app-header";
import { SocialSubNav } from "@/components/features/social/social-sub-nav";
import { SocialProfileHeader } from "@/components/features/social/social-profile-header";
import { FeedPostCard } from "@/components/features/social/feed-post-card";
import { fetchProfile, fetchProfilePosts, fetchProfileReels } from "@/lib/social/api";
import type { SocialProfile, SocialPost, SocialReel } from "@/lib/social/types";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfilePageContentProps {
  profileId: string;
}

export function ProfilePageContent({ profileId }: ProfilePageContentProps) {
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [reels, setReels] = useState<SocialReel[]>([]);
  const [tab, setTab] = useState<"posts" | "reels">("posts");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchProfile(profileId),
      fetchProfilePosts(profileId),
      fetchProfileReels(profileId),
    ]).then(([p, po, r]) => {
      setProfile(p ?? null);
      setPosts(po);
      setReels(r);
    }).finally(() => setLoading(false));
  }, [profileId]);

  if (loading) {
    return (
      <>
        <AppHeader title="Perfil" />
        <main className="mx-auto max-w-2xl p-4"><Skeleton className="h-64 w-full rounded-2xl" /></main>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <AppHeader title="Perfil" />
        <main className="p-8 text-center text-ecopet-gray">Perfil não encontrado</main>
      </>
    );
  }

  return (
    <>
      <AppHeader title={profile.name} />
      <SocialSubNav />
      <main className="mx-auto max-w-2xl flex-1 space-y-4 p-4 lg:p-6">
        <SocialProfileHeader profile={profile} />

        {(profile.products || profile.services) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.products?.map((p) => (
              <Link key={p.id} href="/marketplace" className="flex items-center gap-3 rounded-xl border p-3 hover:shadow-md">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                  <Image src={p.image} alt="" fill className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-ecopet-green font-bold">R$ {p.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
            {profile.services?.map((s) => (
              <Link key={s.id} href="/marketplace" className="rounded-xl border p-3 hover:shadow-md">
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="text-amber-600 font-bold">R$ {s.price.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        )}

        <div className="flex gap-2 border-b border-ecopet-gray/10">
          {(["posts", "reels"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold capitalize ${tab === t ? "border-b-2 border-ecopet-green text-ecopet-green" : "text-ecopet-gray"}`}
            >
              {t === "posts" ? "Posts" : "Reels"}
            </button>
          ))}
        </div>

        {tab === "posts" ? (
          posts.length > 0 ? posts.map((p) => <FeedPostCard key={p.id} post={p} />) : (
            <p className="py-8 text-center text-ecopet-gray">Nenhum post ainda</p>
          )
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {reels.map((r) => (
              <Link key={r.id} href="/social/reels" className="relative aspect-[9/16] overflow-hidden rounded-xl bg-black">
                <Image src={r.thumbnail} alt="" fill className="object-cover opacity-80" />
                <p className="absolute bottom-2 left-2 text-xs font-semibold text-white">▶ {r.likes} curtidas</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
