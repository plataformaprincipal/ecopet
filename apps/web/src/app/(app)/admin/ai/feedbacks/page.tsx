"use client";

import { AIEmptyState } from "@/components/features/ai/ai-empty-state";

export default function AdminAiFeedbacksPage() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold">Feedbacks</h2>
      <p className="text-sm text-muted-foreground">Avaliações de conversas e respostas da IA.</p>
      <div className="mt-4">
        <AIEmptyState
          title="Nenhum feedback"
          description="Feedbacks serão coletados após integração com o provedor de IA."
        />
      </div>
    </div>
  );
}
