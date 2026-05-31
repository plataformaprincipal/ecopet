"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchApprovals, reviewApproval, type ApprovalRequest } from "@/lib/gestor/api";
import { GestorError, GestorLoading } from "./gestor-shell";

export function GestorApprovalsPanel() {
  const [items, setItems] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetchApprovals("PENDING")
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleReview(id: string, status: "APPROVED" | "REJECTED") {
    await reviewApproval(id, status);
    load();
  }

  if (loading) return <GestorLoading />;
  if (error) return <GestorError message={error} />;

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-ecopet-gray">Nenhuma aprovação pendente.</p>
      ) : items.map((item) => (
        <article key={item.id} className="card-premium rounded-[16px] border border-ecopet-gray/10 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{item.type}</Badge>
                <Badge variant="secondary">{item.status}</Badge>
                {item.aiRiskScore != null && (
                  <Badge variant={item.aiRiskScore > 0.5 ? "premium" : "verified"}>
                    Risco IA: {(item.aiRiskScore * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>
              <p className="mt-2 font-semibold">{item.requester.name} — {item.requester.email}</p>
              <p className="text-sm text-ecopet-gray">Role: {item.requester.role} · Entity: {item.entityId}</p>
              {item.aiNotes && <p className="mt-2 text-xs text-ecopet-green">IA: {item.aiNotes}</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleReview(item.id, "APPROVED")}>Aprovar</Button>
              <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleReview(item.id, "REJECTED")}>Recusar</Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
