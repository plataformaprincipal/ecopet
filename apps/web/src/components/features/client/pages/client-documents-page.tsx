"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClientPageHeader } from "../client-page-header";
import { ClientPageSkeleton } from "../client-skeleton";
import { ClientEmptyState } from "../client-empty-state";

type PetDoc = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  petName: string;
  documentDate: string | null;
  url: string | null;
  createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  VACCINATION_CARD: "Carteira de vacinação",
  EXAM: "Exame",
  PRESCRIPTION: "Receita",
  REPORT: "Laudo",
  RECEIPT: "Comprovante",
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function ClientDocumentsPage() {
  const [docs, setDocs] = useState<PetDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/client/documents", { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message ?? "Erro ao carregar documentos");
      setDocs((json.data.documents ?? []) as PetDoc[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <ClientPageSkeleton />;
  if (error) {
    return (
      <div className="space-y-4">
        <ClientPageHeader title="Documentos" description="Documentos dos seus pets." />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30" role="alert">
          {error}
          <Button variant="outline" size="sm" className="ml-3" onClick={load}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClientPageHeader
        title="Documentos"
        description="Carteira de vacinação, exames, receitas, laudos e comprovantes."
      />

      {docs.length === 0 ? (
        <ClientEmptyState
          icon={FileText}
          title="Nenhum documento"
          description="Os documentos adicionados aos seus pets aparecerão aqui."
          actionLabel="Ver meus pets"
          actionHref="/cliente/pets"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-white/10 dark:bg-zinc-900/60">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500 dark:border-white/5">
              <tr>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Pet</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-b border-zinc-50 last:border-0 dark:border-white/5">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{d.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      {TYPE_LABELS[d.type] ?? d.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{d.petName}</td>
                  <td className="px-4 py-3 text-zinc-500">{fmt(d.documentDate ?? d.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {d.url ? (
                      <Link href={d.url} target="_blank" className="inline-flex items-center gap-1 text-emerald-700 hover:underline dark:text-emerald-400">
                        Abrir <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
