"use client";

import { AdminAiSection } from "@/components/features/admin/admin-ai-section";
import { Badge } from "@/components/ui/badge";

export default function AdminAiModelsPage() {
  return (
    <AdminAiSection
      title="Modelos"
      description="Registro de modelos por provedor com capacidades e custos."
      endpoint="/api/ai/models"
      render={(data) => {
        const models = (data as { models: { id: string; label: string; provider: string; contextWindow: number; streaming: boolean; vision: boolean; functionCalling: boolean; status: string }[] }).models ?? [];
        return (
          <div className="space-y-2">
            {models.map((m) => (
              <div key={m.id} className="rounded border px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{m.label}</span>
                  <Badge variant="outline">{m.provider}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Context: {m.contextWindow.toLocaleString("pt-BR")} ·
                  Streaming: {m.streaming ? "sim" : "não"} ·
                  Vision: {m.vision ? "sim" : "não"} ·
                  Tools: {m.functionCalling ? "sim" : "não"}
                </p>
              </div>
            ))}
          </div>
        );
      }}
    />
  );
}
