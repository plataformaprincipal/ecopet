"use client";

import { AdminAiSection, AdminAiProviderBanner } from "@/components/features/admin/admin-ai-section";
import { Badge } from "@/components/ui/badge";

export default function AdminAiProvidersPage() {
  return (
    <>
      <AdminAiSection
        title="Providers"
        description="Provedores registrados na plataforma."
        endpoint="/api/ai/providers"
        render={(data) => {
          const d = data as {
            providers: { code: string; name: string; status: string; isConfigured: boolean; modelCount: number }[];
            status: { ready: boolean };
            message: string | null;
          };
          return (
            <div className="space-y-4">
              <AdminAiProviderBanner configured={d.status?.ready ?? false} />
              <div className="space-y-2">
                {d.providers?.map((p) => (
                  <div key={p.code} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                    <span>{p.name}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">{p.modelCount} modelos</Badge>
                      <Badge variant={p.isConfigured ? "default" : "secondary"}>
                        {p.isConfigured ? "Configurado" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {d.message && <p className="text-sm text-amber-700">{d.message}</p>}
              </div>
            </div>
          );
        }}
      />
    </>
  );
}
