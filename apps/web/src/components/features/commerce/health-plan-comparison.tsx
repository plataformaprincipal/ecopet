import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCatalogBySku } from "@/lib/pricing/catalog";

const ROWS = [
  { sku: "PRT-001", waiting: "Conforme operador", network: "Rede do operador", dependents: "Pets indicados na adesão" },
  { sku: "PRT-002", waiting: "Conforme operador", network: "Rede ambulatorial credenciada", dependents: "Pets cobertos pelo contrato" },
  { sku: "PRT-003", waiting: "Conforme operador", network: "Rede completa do operador", dependents: "Pets cobertos pelo contrato" },
];

function brl(cents: number | null | undefined) {
  if (cents == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function HealthPlanComparison() {
  return (
    <Card data-testid="health-plan-comparison">
      <CardHeader>
        <CardTitle>Comparação de planos</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto text-sm">
        <p className="mb-3 text-muted-foreground">
          Preços oficiais do PFO. A EccoPet não oferece cobertura própria. Carência, rede e utilização são do operador autorizado.
        </p>
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="text-left">
              <th className="border-b p-2">Plano</th>
              <th className="border-b p-2">SKU</th>
              <th className="border-b p-2">Mensal</th>
              <th className="border-b p-2">Carência</th>
              <th className="border-b p-2">Rede</th>
              <th className="border-b p-2">Pets</th>
              <th className="border-b p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const item = getCatalogBySku(row.sku);
              return (
                <tr key={row.sku}>
                  <td className="border-b p-2">{item?.name ?? row.sku}</td>
                  <td className="border-b p-2 font-mono">{row.sku}</td>
                  <td className="border-b p-2">{brl(item?.amountCents)}</td>
                  <td className="border-b p-2">{row.waiting}</td>
                  <td className="border-b p-2">{row.network}</td>
                  <td className="border-b p-2">{row.dependents}</td>
                  <td className="border-b p-2">{item?.commercialAvailability ?? "PARTNER_REQUIRED"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
