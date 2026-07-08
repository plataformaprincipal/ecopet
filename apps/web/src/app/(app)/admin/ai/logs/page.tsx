"use client";

import { AdminAiSection } from "@/components/features/admin/admin-ai-section";

export default function AdminAiLogsPage() {
  return (
    <AdminAiSection
      title="Logs"
      description="Registro de requisições, tokens, tempo e erros."
      endpoint="/api/ai/logs?admin=true&limit=50"
      render={(data) => {
        const logs = (data as { logs: { id: string; createdAt: string; tokensInput: number; tokensOutput: number; durationMs: number; errorCode: string | null }[] }).logs ?? [];
        return (
          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum log registrado.</p>
            ) : (
              logs.map((l) => (
                <div key={l.id} className="rounded border px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <span>{new Date(l.createdAt).toLocaleString("pt-BR")}</span>
                    <span className="text-muted-foreground">{l.durationMs}ms</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {l.tokensInput}+{l.tokensOutput} tokens
                    {l.errorCode && ` · Erro: ${l.errorCode}`}
                  </p>
                </div>
              ))
            )}
          </div>
        );
      }}
    />
  );
}
