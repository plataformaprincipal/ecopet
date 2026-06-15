"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FollowButton } from "./follow-button";
import { BlockUserButton } from "./block-user-button";
import { SocialFeed } from "./social-feed";
import { fetchPublicProfile, type ApiPublicProfile } from "@/lib/social/client-api";
import { Skeleton } from "@/components/ui/skeleton";

export function PublicProfilePage({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<ApiPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicProfile(userId)
      .then((d) => setProfile(d.profile))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (error || !profile) return <p className="text-red-600">{error ?? "Perfil não encontrado"}</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6">
        {profile.coverUrl && (
          <div className="mb-4 h-32 overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatarUrl ?? undefined} />
            <AvatarFallback>{profile.displayName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{profile.displayName}</h1>
            <p className="text-sm text-muted-foreground">{profile.roleLabel}</p>
            {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
            <div className="mt-2 flex gap-4 text-sm">
              <span>{profile.counts.posts} posts</span>
              <span>{profile.counts.followers} seguidores</span>
              <span>{profile.counts.following} seguindo</span>
            </div>
          </div>
          {profile.viewerState && !profile.viewerState.isSelf && (
            <div className="flex gap-2">
              <FollowButton userId={userId} initialFollowing={profile.viewerState.isFollowing} />
              <BlockUserButton userId={userId} initialBlocked={profile.viewerState.isBlocked} />
            </div>
          )}
          {profile.viewerState?.isSelf && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/feed/profile/me">Editar perfil</Link>
            </Button>
          )}
        </div>
      </div>
      <SocialFeed authorId={userId} />
    </div>
  );
}
