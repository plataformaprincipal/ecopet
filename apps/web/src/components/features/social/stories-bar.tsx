"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SocialStory } from "@/lib/social/types";

interface StoriesBarProps {
  stories: SocialStory[];
}

export function StoriesBar({ stories }: StoriesBarProps) {
  return (
    <div className="mb-4 flex gap-3 overflow-x-auto pb-2 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Link
        href="/social/stories"
        className="flex shrink-0 flex-col items-center gap-1"
      >
        <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gradient-to-br from-ecopet-green to-ecopet-yellow p-[2px]">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-[#0f1419]">
            <Plus className="h-6 w-6 text-ecopet-green" />
          </div>
        </div>
        <span className="max-w-[64px] truncate text-[10px] font-medium">Seu story</span>
      </Link>
      {stories.map((story) => (
        <Link
          key={story.id}
          href="/social/stories"
          className="flex shrink-0 flex-col items-center gap-1"
        >
          <div
            className={cn(
              "rounded-full p-[2px]",
              story.viewed
                ? "bg-ecopet-gray/30"
                : story.isAdoption
                  ? "bg-gradient-to-br from-rose-500 to-pink-500"
                  : story.isSponsored
                    ? "bg-gradient-to-br from-ecopet-yellow to-amber-500"
                    : "bg-gradient-to-br from-ecopet-green to-ecopet-yellow"
            )}
          >
            <div className="rounded-full bg-white p-[2px] dark:bg-[#0f1419]">
              <div className="relative h-14 w-14 overflow-hidden rounded-full">
                <Image src={story.profile.avatar} alt={story.profile.name} fill className="object-cover" />
              </div>
            </div>
          </div>
          <span className="max-w-[64px] truncate text-[10px] font-medium">
            {story.label ?? story.profile.name.split(" ")[0]}
          </span>
        </Link>
      ))}
    </div>
  );
}
