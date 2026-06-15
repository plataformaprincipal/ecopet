"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Post = { id: string; content: string; status: string; author: { name: string } };

export function AdminSocialModerationPanel({ type }: { type: "posts" | "comments" }) {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/social/${type}`, { credentials: "include" });
      const body = await res.json();
      if (body.success) setItems(body.data[type] ?? body.data.posts ?? body.data.comments);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  async function moderate(id: string, action: string) {
    await fetch(`/api/admin/social/${type}/${id}/moderate`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: "Moderação admin" }),
    });
    load();
  }

  if (loading) return <p>Carregando...</p>;
  if (!items.length) return <p className="text-muted-foreground">Nenhum item.</p>;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded border p-4">
          <p className="font-medium">{item.author?.name}</p>
          <p className="text-sm">{item.content}</p>
          <p className="text-xs text-muted-foreground">Status: {item.status}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => moderate(item.id, "HIDE")}>
              Ocultar
            </Button>
            <Button size="sm" onClick={() => moderate(item.id, "RESTORE")}>
              Restaurar
            </Button>
            <Button size="sm" variant="destructive" onClick={() => moderate(item.id, "REMOVE")}>
              Remover
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
