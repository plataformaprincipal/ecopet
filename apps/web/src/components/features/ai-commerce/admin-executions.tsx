"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  sku: string;
  status: string;
  model: string | null;
  durationMs: number | null;
  estimatedCostUsd: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  failureCode: string | null;
  petName: string;
  createdAt: string;
};

export function AdminAiExecutionsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("");
  const [sku, setSku] = useState("");

  const load = useCallback(async (signal: AbortSignal) => {
    const q = new URLSearchParams();
    if (status) q.set("status", status);
    if (sku) q.set("sku", sku);
    try {
      const r = await fetch(`/api/admin/ai/commerce-executions?${q}`, {
        credentials: "include",
        signal,
      });
      const d = await r.json();
      if (signal.aborted) return;
      if (d.success) setRows(d.data.items);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }, [status, sku]);

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [load]);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Execuções de IA comercial</h1>
      <div className="mt-4 flex flex-wrap gap-3">
        <select
          aria-label="Filtrar status"
          className="rounded-lg border bg-transparent px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="DRAFT">DRAFT</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="FAILED">FAILED</option>
        </select>
        <select
          aria-label="Filtrar produto"
          className="rounded-lg border bg-transparent px-3 py-2 text-sm"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
        >
          <option value="">Todos os SKUs</option>
          <option value="AI_ECCOVET">AI_ECCOVET</option>
          <option value="AI_ECCOVET_VISION">AI_ECCOVET_VISION</option>
          <option value="AI_ECCOLAB">AI_ECCOLAB</option>
          <option value="AI_ECCOCHECKUP">AI_ECCOCHECKUP</option>
        </select>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>SKU</th>
              <th>Status</th>
              <th>Modelo</th>
              <th>Duração</th>
              <th>Custo est.</th>
              <th>Tokens</th>
              <th>Erro</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="font-mono text-xs">{r.id.slice(0, 10)}</td>
                <td>{r.sku}</td>
                <td>{r.status}</td>
                <td>{r.model}</td>
                <td>{r.durationMs ? `${Math.round(r.durationMs / 1000)}s` : "—"}</td>
                <td>{r.estimatedCostUsd?.toFixed(4)}</td>
                <td>
                  {r.inputTokens ?? 0}/{r.outputTokens ?? 0}
                </td>
                <td>{r.failureCode ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
