"use client";

import { AdminAiSection } from "@/components/features/admin/admin-ai-section";
import { Badge } from "@/components/ui/badge";

export default function AdminAiAgentsPage() {
  return (
    <AdminAiSection
      title="Agentes"
      description="13 agentes especializados com prompts, modelos, ferramentas e permissões."
      endpoint="/api/ai/agents"
      render={(data) => {
        const agents = (data as { agents: { id: string; name: string; description: string; tools: string[] }[] }).agents ?? [];
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((a) => (
              <div key={a.id} className="rounded-lg border p-4">
                <p className="font-medium">{a.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="outline">{a.id}</Badge>
                  {a.tools?.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      }}
    />
  );
}
