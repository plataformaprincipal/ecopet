"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Report = {
  id: string;
  reason: string;
  status: string;
  reporter: { name: string };
  message: { content: string };
};

export default function AdminReportsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Report[]>([]);

  useEffect(() => {
    fetch("/api/admin/messages/reports", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.success) setItems(j.data.items); });
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-xl font-bold">Denúncias de mensagens</h1>
      {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma denúncia pendente.</p>}
      {items.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => router.push(`/dashboard/admin/messages/reports/${r.id}`)}
          className="block w-full rounded-xl border p-4 text-left"
        >
          <p className="font-semibold">{r.reason}</p>
          <p className="text-xs text-muted-foreground">{r.status} — por {r.reporter.name}</p>
        </button>
      ))}
    </div>
  );
}
