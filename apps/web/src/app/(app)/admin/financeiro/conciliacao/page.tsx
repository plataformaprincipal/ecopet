"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/features/admin/ui/admin-page-header";

export default function AdminFinanceiroConciliacaoPage() {
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/mercado-pago/reconcile", {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Falha");
      setResult(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <AdminPageHeader
        title="Conciliação financeira"
        description="Compara pedidos/pagamentos EcoPet com registros e detecta divergências."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Financeiro", href: "/admin/financeiro" },
          { label: "Conciliação" },
        ]}
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/financeiro/pagamentos">Pagamentos</Link>
        </Button>
      </AdminPageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Executar conciliação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button type="button" onClick={() => void run()} disabled={loading}>
            {loading ? "Conciliando…" : "Rodar agora"}
          </Button>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          {result ? (
            <pre className="max-h-96 overflow-auto rounded bg-muted/40 p-3 text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
