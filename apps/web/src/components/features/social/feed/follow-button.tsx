"use client";

import { useState } from "react";
import { UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { followUser, unfollowUser } from "@/lib/social/client-api";

export function FollowButton({ userId, initialFollowing }: { userId: string; initialFollowing?: boolean }) {
  const [following, setFollowing] = useState(initialFollowing ?? false);

  async function toggle() {
    try {
      const data = following ? await unfollowUser(userId) : await followUser(userId);
      setFollowing(data.following);
    } catch {
      /* ignore */
    }
  }

  return (
    <Button variant={following ? "outline" : "default"} size="sm" onClick={toggle}>
      {following ? <UserMinus className="mr-1 h-4 w-4" /> : <UserPlus className="mr-1 h-4 w-4" />}
      {following ? "Deixar de seguir" : "Seguir"}
    </Button>
  );
}
