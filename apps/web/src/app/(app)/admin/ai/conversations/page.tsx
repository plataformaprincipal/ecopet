"use client";

import { AdminAiSection } from "@/components/features/admin/admin-ai-section";
import { AIEmptyState } from "@/components/features/ai/ai-empty-state";

export default function AdminAiConversationsPage() {
  return (
    <AdminAiSection
      title="Conversas"
      description="Histórico de conversas da plataforma AI."
      endpoint="/api/ai/history?limit=30"
      render={(data) => {
        const sessions = (data as { sessions: unknown[] }).sessions ?? [];
        if (sessions.length === 0) {
          return <AIEmptyState title="Nenhuma conversa" description="Conversas aparecerão após uso do chat com provedor configurado." />;
        }
        return (
          <div className="space-y-2">
            {sessions.map((s) => {
              const row = s as { id: string; type: string; updatedAt: string };
              return (
                <div key={row.id} className="rounded border px-3 py-2 text-sm">
                  <span className="font-medium">{row.type}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {new Date(row.updatedAt).toLocaleString("pt-BR")}
                  </span>
                </div>
              );
            })}
          </div>
        );
      }}
    />
  );
}
