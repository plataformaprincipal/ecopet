"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/features/gestor-admin/data-table";

type RequestRow = {
  id: string;
  type: string;
  status: string;
  user: { name: string; email: string };
  requestedAt: string;
};

export function AdminPrivacyRequestsPanel() {
  const [items, setItems] = useState<RequestRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/privacy-requests", { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        if (!b.success) throw new Error(b.error?.message);
        setItems(b.data?.items ?? []);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <DataTable
        rows={items.map((r) => ({
          id: r.id,
          tipo: r.type,
          status: r.status,
          usuario: r.user?.name,
          email: r.user?.email,
          solicitado: r.requestedAt,
        }))}
        emptyLabel="Nenhuma solicitação LGPD registrada."
      />
      <Link href="/dashboard/admin" className="text-sm underline">
        Voltar ao admin
      </Link>
    </div>
  );
}
