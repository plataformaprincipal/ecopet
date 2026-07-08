"use client";

import { AdminAiSection } from "@/components/features/admin/admin-ai-section";
import { Badge } from "@/components/ui/badge";

export default function AdminAiToolsPage() {
  return (
    <AdminAiSection
      title="Ferramentas"
      description="Tools registradas para function calling por agente."
      endpoint="/api/ai/tools"
      render={(data) => {
        const tools = (data as { tools: { id: string; name: string; description: string; status: string }[] }).tools ?? [];
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {tools.map((t) => (
              <div key={t.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{t.name}</p>
                  <Badge variant="outline">{t.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
              </div>
            ))}
          </div>
        );
      }}
    />
  );
}
