"use client";

import { useEffect, useState } from "react";
import { fetchAuditLogs, type AuditLogEntry } from "@/lib/gestor/api";
import { GestorError, GestorLoading } from "./gestor-shell";

export function GestorAuditPanel() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs()
      .then(setLogs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <GestorLoading />;
  if (error) return <GestorError message={error} />;

  return (
    <div className="overflow-x-auto rounded-[16px] border border-ecopet-gray/10">
      <table className="w-full min-w-[700px] text-sm">
        <thead className="bg-ecopet-gray/5">
          <tr>
            <th className="p-3 text-left">Data</th>
            <th className="p-3 text-left">Usuário</th>
            <th className="p-3 text-left">Ação</th>
            <th className="p-3 text-left">Módulo</th>
            <th className="p-3 text-left">Recurso</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t border-ecopet-gray/10">
              <td className="p-3 text-xs text-ecopet-gray">{new Date(log.createdAt).toLocaleString("pt-BR")}</td>
              <td className="p-3">{log.actor?.name ?? "Sistema"}</td>
              <td className="p-3 font-medium">{log.action}</td>
              <td className="p-3">{log.module}</td>
              <td className="p-3">{log.resource}{log.resourceId ? ` #${log.resourceId.slice(0, 8)}` : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
