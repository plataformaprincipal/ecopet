"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, MessageCircle, Calendar, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SocialProfile } from "@/lib/social/types";
import { PROFILE_TYPE_LABELS, formatCount } from "@/lib/social/config";
import { useSocialStore } from "@/store/social-store";

interface SocialProfileHeaderProps {
  profile: SocialProfile;
}

export function SocialProfileHeader({ profile }: SocialProfileHeaderProps) {
  const toggleFollow = useSocialStore((s) => s.toggleFollow);
  const isFollowing = useSocialStore((s) => s.isFollowing(profile.id));

  return (
    <div className="overflow-hidden rounded-2xl border border-ecopet-gray/10 bg-white shadow-sm dark:bg-[#0f1419]">
      <div className="relative h-32 bg-gradient-to-r from-ecopet-dark to-ecopet-green lg:h-40">
        {profile.cover && (
          <Image src={profile.cover} alt="" fill className="object-cover opacity-60" />
        )}
      </div>
      <div className="relative px-4 pb-4">
        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-4 border-white shadow-lg dark:border-[#0f1419]">
            <Image src={profile.avatar} alt={profile.name} fill className="object-cover" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/messages"><MessageCircle className="h-4 w-4" /> Contato</Link>
            </Button>
            {(profile.type === "veterinarian" || profile.type === "clinic") && (
              <Button variant="secondary" size="sm" asChild>
                <Link href="/veterinarios"><Calendar className="h-4 w-4" /> Agendar</Link>
              </Button>
            )}
            {(profile.type === "petshop" || profile.type === "store") && (
              <Button size="sm" asChild>
                <Link href="/marketplace"><ShoppingBag className="h-4 w-4" /> Marketplace</Link>
              </Button>
            )}
            {profile.id !== "p1" && (
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "default"}
                onClick={() => toggleFollow(profile.id)}
              >
                {isFollowing ? "Seguindo" : "Seguir"}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-bold text-ecopet-dark dark:text-white">{profile.name}</h1>
            {profile.isVerified && <Badge variant="verified">✓ Verificado</Badge>}
            <Badge variant="default">{PROFILE_TYPE_LABELS[profile.type]}</Badge>
          </div>
          <p className="text-sm text-ecopet-gray">@{profile.username}</p>
          <p className="mt-2 text-sm">{profile.bio}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-ecopet-gray">
            <MapPin className="h-3.5 w-3.5" /> {profile.location}
          </p>
          {profile.rating && (
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-amber-600">
              <Star className="h-4 w-4 fill-current" /> {profile.rating}
            </p>
          )}
        </div>

        <div className="mt-4 flex gap-6 text-sm">
          <div><strong>{formatCount(profile.followers)}</strong> <span className="text-ecopet-gray">seguidores</span></div>
          <div><strong>{formatCount(profile.following)}</strong> <span className="text-ecopet-gray">seguindo</span></div>
        </div>

        {profile.pets && profile.pets.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase text-ecopet-gray">Pets</p>
            <div className="flex gap-2">
              {profile.pets.map((pet) => (
                <div key={pet.id} className="flex items-center gap-2 rounded-xl bg-ecopet-green/5 px-3 py-2">
                  <div className="relative h-8 w-8 overflow-hidden rounded-full">
                    <Image src={pet.avatar} alt="" fill className="object-cover" />
                  </div>
                  <span className="text-sm font-medium">{pet.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.badges.map((b) => (
              <Badge key={b} variant="premium" className="text-[10px]">{b}</Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
