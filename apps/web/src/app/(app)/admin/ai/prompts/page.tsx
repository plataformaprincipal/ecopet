"use client";

import { AdminAiSection } from "@/components/features/admin/admin-ai-section";
import { Badge } from "@/components/ui/badge";

export default function AdminAiPromptsPage() {
  return (
    <AdminAiSection
      title="Prompts"
      description="Registry versionado de prompts por agente e categoria."
      endpoint="/api/ai/prompts"
      render={(data) => {
        const prompts = (data as { prompts: { key: string; name: string; version: string; category: string; isActive: boolean }[] }).prompts ?? [];
        return (
          <div className="space-y-2">
            {prompts.map((p) => (
              <div key={`${p.key}-${p.version}`} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-2 text-muted-foreground">v{p.version}</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{p.category}</Badge>
                  <Badge variant={p.isActive ? "default" : "secondary"}>{p.isActive ? "Ativo" : "Inativo"}</Badge>
                </div>
              </div>
            ))}
          </div>
        );
      }}
    />
  );
}
