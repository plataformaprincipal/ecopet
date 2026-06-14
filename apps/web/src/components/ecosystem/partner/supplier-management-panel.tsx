"use client";

import { Plus, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "@/providers/i18n-provider";

export function SupplierManagementPanel() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">Fornecedores</h3>
          <p className="text-sm text-ecopet-gray">Cadastro, contratos, avaliações e insights IA</p>
        </div>
        <Button><Plus className="h-4 w-4" /> Cadastrar fornecedor</Button>
      </div>

      <EmptyState
        icon={Truck}
        title={t("empty.admin.noData")}
        description={t("empty.admin.noData")}
      />
    </div>
  );
}
