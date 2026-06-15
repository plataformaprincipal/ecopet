"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { savePost, unsavePost } from "@/lib/social/client-api";

export function SaveButton({ postId, initialSaved }: { postId: string; initialSaved?: boolean }) {
  const [saved, setSaved] = useState(initialSaved ?? false);

  async function toggle() {
    try {
      const data = saved ? await unsavePost(postId) : await savePost(postId);
      setSaved(data.saved);
    } catch {
      /* ignore */
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className={saved ? "text-ecopet-primary" : ""}>
      <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
    </Button>
  );
}
