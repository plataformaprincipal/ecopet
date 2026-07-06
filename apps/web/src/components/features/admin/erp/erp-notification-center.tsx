"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { adminFetch } from "@/lib/admin/client-api";

type NotificationRow = { id: string; title: string; body: string; createdAt: string; read: boolean };

export function ErpNotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await adminFetch<{ items: NotificationRow[]; unread: number }>("/api/admin/erp/notifications");
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="relative">
      <Button type="button" variant="ghost" size="icon" aria-label="Notificações" onClick={() => setOpen((o) => !o)}>
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40" aria-label="Fechar" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border bg-white shadow-lg dark:bg-gray-950">
            <div className="border-b p-3 text-sm font-semibold">Centro de notificações</div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Nenhuma notificação.</p>
              ) : (
                items.map((n) => (
                  <div key={n.id} className="border-b px-3 py-2 text-sm last:border-0">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                  </div>
                ))
              )}
            </div>
            <Link href="/admin/audit" className="block border-t p-2 text-center text-xs text-ecopet-green hover:underline">
              Ver auditoria
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
