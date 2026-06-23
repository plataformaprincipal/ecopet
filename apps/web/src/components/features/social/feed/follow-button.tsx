"use client";

import { useState } from "react";
import { UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { followUser, unfollowUser } from "@/lib/social/client-api";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";

export function FollowButton({ userId, initialFollowing }: { userId: string; initialFollowing?: boolean }) {
  const { requireAuth } = useAuthGate();
  const { t } = useTranslation();
  const [following, setFollowing] = useState(initialFollowing ?? false);

  async function toggle() {
    requireAuth(async () => {
      try {
        const data = following ? await unfollowUser(userId) : await followUser(userId);
        setFollowing(data.following);
      } catch {
        /* ignore */
      }
    });
  }

  return (
    <Button variant={following ? "outline" : "default"} size="sm" onClick={toggle} aria-pressed={following}>
      {following ? <UserMinus className="mr-1 h-4 w-4" aria-hidden /> : <UserPlus className="mr-1 h-4 w-4" aria-hidden />}
      {following ? t("socialFeed.actions.unfollow") : t("socialFeed.actions.follow")}
    </Button>
  );
}
