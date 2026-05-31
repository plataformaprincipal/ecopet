"use client";

import Image from "next/image";
import { MapPin, Settings, Shield, Bell, Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { SmartProfileData } from "@/lib/profile/types";
import { CATEGORY_LABELS } from "@/lib/profile/role-mapper";

interface ProfileHeaderProps {
  profile: SmartProfileData;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ecopet-gray/10 bg-white shadow-sm dark:bg-white/5">
      <div className="relative h-32 sm:h-40">
        <Image src={profile.coverImage} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute right-3 top-3 flex gap-2">
          <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/90" asChild>
            <Link href="/configuracoes"><Bell className="h-4 w-4" /></Link>
          </Button>
          <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/90">
            <Moon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="relative px-4 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="relative -mt-12 h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white shadow-lg dark:border-[#0f1419]">
            <Image src={profile.avatar} alt={profile.name} fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold sm:text-2xl">{profile.name}</h1>
              {profile.isVerified && <Badge variant="verified">Verificado</Badge>}
              {profile.isPremium && <Badge variant="premium">Premium</Badge>}
              <Badge variant="default">{CATEGORY_LABELS[profile.category]}</Badge>
            </div>
            <p className="text-sm text-ecopet-gray">{profile.subtitle}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-ecopet-gray">
              <MapPin className="h-3 w-3" /> {profile.location}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/configuracoes">
              <Button variant="outline" size="sm"><Settings className="h-4 w-4" /> Editar</Button>
            </Link>
            <Button variant="ghost" size="icon"><Shield className="h-4 w-4" /></Button>
          </div>
        </div>
        <p className="mt-3 text-sm text-ecopet-gray">{profile.bio}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {profile.badges.map((b) => (
            <Badge key={b} variant="default" className="text-[10px]">{b}</Badge>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {profile.metrics.map((m) => (
            <div key={m.label} className="rounded-xl bg-ecopet-gray/5 px-3 py-2 text-center">
              <p className="font-display text-lg font-bold">{m.value}</p>
              <p className="text-[10px] uppercase tracking-wide text-ecopet-gray">{m.label}</p>
              {m.trend && <p className="text-[10px] text-ecopet-green">{m.trend}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
