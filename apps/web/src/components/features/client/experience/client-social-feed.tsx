"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";
import { StoriesRail } from "@/components/features/social/ecopet-social/stories-rail";
import { PostComposer } from "@/components/features/social/feed/post-composer";
import { SocialFeedStream } from "@/components/features/social/ecopet-social/social-feed-stream";
import {
  SOCIAL_FILTERS,
  DEFAULT_SOCIAL_FILTER,
  type SocialFilterId,
} from "@/components/features/social/ecopet-social/filters";

export function ClientSocialFeed() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<SocialFilterId>(DEFAULT_SOCIAL_FILTER.id);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <StoriesRail />

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label={t("clientArea.sections.social")}>
        {SOCIAL_FILTERS.map((f) => {
          const Icon = f.icon;
          const active = f.id === filter;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/5 dark:text-zinc-300"
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {t(f.labelKey)}
            </button>
          );
        })}
      </div>

      <PostComposer onPublished={() => setRefreshKey((k) => k + 1)} />

      <SocialFeedStream key={`${filter}-${refreshKey}`} activeFilter={filter} />
    </div>
  );
}
