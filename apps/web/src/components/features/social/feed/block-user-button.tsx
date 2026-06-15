"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blockUser } from "@/lib/social/client-api";

export function BlockUserButton({ userId, initialBlocked }: { userId: string; initialBlocked?: boolean }) {
  const [blocked, setBlocked] = useState(initialBlocked ?? false);

  async function handleBlock() {
    if (blocked || !confirm("Bloquear este usuário?")) return;
    try {
      await blockUser(userId);
      setBlocked(true);
    } catch {
      /* ignore */
    }
  }

  if (blocked) return <span className="text-xs text-muted-foreground">Bloqueado</span>;

  return (
    <Button variant="ghost" size="sm" onClick={handleBlock}>
      <Ban className="mr-1 h-4 w-4" /> Bloquear
    </Button>
  );
}
