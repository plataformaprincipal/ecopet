"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Report = {
  id: string;
  reason: string;
  status: string;
  description?: string | null;
  resolution?: string | null;
  createdAt: string;
  reporter?: { id: string; name: string } | null;
  reviewedBy?: { id: string; name: string } | null;
  post?: { id: string; content: string; authorId: string; author?: { id: string; name: string } } | null;
  comment?: { id: string; content: string; authorId: string } | null;
  targetSnapshot?: { postId?: string; authorId?: string; content?: string } | null;
};

const STATUSES = ["", "OPEN", "REVIEWING", "RESOLVED", "REJECTED"] as const;

export function AdminSocialReportsPanel() {
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  async function load(nextStatus = status) {
    setLoading(true);
    try {
      const q = nextStatus ? `?status=${nextStatus}` : "";
      const res = await fetch(`/api/admin/social/reports${q}`, { credentials: "include" });
      const body = await res.json();
      if (body.success) setReports(body.data.reports);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function resolve(id: string, next: string) {
    await fetch(`/api/admin/social/reports/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, resolution: next }),
    });
    void load(status);
  }

  const selected = reports.find((r) => r.id === openId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button
            key={s || "all"}
            size="sm"
            variant={status === s ? "default" : "outline"}
            onClick={() => {
              setStatus(s);
              void load(s);
            }}
          >
            {s || "Todas"}
          </Button>
        ))}
      </div>
      {loading ? <p>Carregando denúncias...</p> : null}
      {!loading && !reports.length ? <p className="text-[var(--ep-fg-muted)]">Nenhuma denúncia.</p> : null}
      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4">
            <p className="text-sm font-medium text-[var(--ep-fg)]">
              {r.reason} — {r.status}
            </p>
            <p className="text-xs text-[var(--ep-fg-muted)]">{new Date(r.createdAt).toLocaleString("pt-BR")}</p>
            <p className="mt-2 text-sm text-[var(--ep-fg)]">
              {r.post?.content ?? r.comment?.content ?? r.targetSnapshot?.content ?? "—"}
            </p>
            <p className="mt-1 text-xs text-[var(--ep-fg-muted)]">
              Autor: {r.post?.author?.name ?? r.post?.authorId ?? "—"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setOpenId(r.id)}>
                Abrir
              </Button>
              {r.post?.id ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/feed/post/${r.post.id}`}>Ver publicação</Link>
                </Button>
              ) : null}
              <Button size="sm" onClick={() => void resolve(r.id, "REVIEWING")}>
                Em análise
              </Button>
              <Button size="sm" onClick={() => void resolve(r.id, "RESOLVED")}>
                Resolver
              </Button>
              <Button size="sm" variant="outline" onClick={() => void resolve(r.id, "REJECTED")}>
                Rejeitar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {selected ? (
        <div className="rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-muted)] p-4 text-sm">
          <p className="font-semibold">Denúncia {selected.id}</p>
          <p>Motivo: {selected.reason}</p>
          <p>Status: {selected.status}</p>
          <p>Detalhes: {selected.description || "—"}</p>
          <p>Denunciante (admin): {selected.reporter?.name ?? selected.reporter?.id ?? "—"}</p>
          <p>Revisor: {selected.reviewedBy?.name ?? "—"}</p>
          <p>Resultado: {selected.resolution || "—"}</p>
          {selected.targetSnapshot?.content ? (
            <p data-testid="report-snapshot">Snapshot: {selected.targetSnapshot.content}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
