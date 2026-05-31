"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, AlertTriangle, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileSection } from "@/components/profile/shared/smart-widgets";
import { MOCK_SUPPLIERS } from "@/lib/ecosystem/mock-data";
import { cn } from "@/lib/utils";

export function SupplierManagementPanel() {
  const [suppliers] = useState(MOCK_SUPPLIERS);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">Fornecedores</h3>
          <p className="text-sm text-ecopet-gray">Cadastro, contratos, avaliações e insights IA</p>
        </div>
        <Button><Plus className="h-4 w-4" /> Cadastrar fornecedor</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {suppliers.map((s) => (
          <article key={s.id} className="card-premium rounded-[16px] border border-ecopet-gray/10 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold">{s.name}</h4>
                <p className="text-sm text-ecopet-gray">{s.category}</p>
              </div>
              <Badge variant={s.riskLevel === "low" ? "verified" : s.riskLevel === "medium" ? "premium" : "secondary"}>
                Risco {s.riskLevel === "low" ? "baixo" : s.riskLevel === "medium" ? "médio" : "alto"}
              </Badge>
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-ecopet-yellow" />
              <span className="font-semibold">{s.rating}</span>
              <span className="text-ecopet-gray">· Prazo: {s.paymentTerms}</span>
            </div>

            <div className="mt-2">
              <p className="text-xs font-medium text-ecopet-gray">Produtos fornecidos</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {s.products.map((p) => <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>)}
              </div>
            </div>

            {s.aiNote && (
              <div className={cn(
                "mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs",
                s.riskLevel === "medium" ? "bg-amber-500/10 text-amber-700" : "bg-ecopet-green/10 text-ecopet-green"
              )}>
                {s.riskLevel === "medium" ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> : <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                IA: {s.aiNote}
              </div>
            )}

            <div className="mt-3 flex gap-2 border-t border-ecopet-gray/10 pt-3">
              <Button size="sm" variant="outline"><Edit className="h-3.5 w-3.5" /> Editar</Button>
              <Button size="sm" variant="ghost" className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </article>
        ))}
      </div>

      <ProfileSection title="Sugestões IA">
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-ecopet-yellow" /> Renegociar contrato com Distribuidora Pet SP — atrasos recorrentes</p>
          <p className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-ecopet-green" /> Golden Pet Foods: melhor custo-benefício para rações premium</p>
        </div>
      </ProfileSection>
    </div>
  );
}
