"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

const ROLE_STYLES: Record<string, string> = {
  CLIENT: "bg-blue-50 text-blue-700 border-blue-200",
  PARTNER: "bg-amber-50 text-amber-800 border-amber-200",
  ONG: "bg-emerald-50 text-emerald-800 border-emerald-200",
  ADMIN: "bg-purple-50 text-purple-800 border-purple-200",
};

function roleBadgeKey(role: string): string {
  if (role === "ONG") return "ONG";
  return role in ROLE_STYLES ? role : "CLIENT";
}

export function PersonaBadge({ role, verified }: { role: string; verified?: boolean }) {
  const { t } = useTranslation();
  const key = roleBadgeKey(role);
  const labelKey = `socialFeed.badges.${key}` as const;

  return (
    <span className="inline-flex items-center gap-1">
      <Badge variant="outline" className={cn("text-[10px] font-semibold uppercase tracking-wide", ROLE_STYLES[key])}>
        {t(labelKey)}
      </Badge>
      {verified && (
        <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wide bg-sky-50 text-sky-700 border-sky-200">
          {t("socialFeed.badges.verified")}
        </Badge>
      )}
    </span>
  );
}

export function PostTypeBadge({ type }: { type: string }) {
  const { t } = useTranslation();
  const labelKey = `socialFeed.postTypes.${type}` as const;

  return (
    <Badge variant="secondary" className="text-[10px] font-medium">
      {t(labelKey)}
    </Badge>
  );
}
