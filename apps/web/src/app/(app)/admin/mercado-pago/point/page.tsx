import { MercadoPagoHubPanel } from "@/components/features/admin/mercado-pago-hub-panel";

export default function AdminMpPointPage() {
  return (
    <div className="space-y-2">
      <MercadoPagoHubPanel />
      <p className="px-6 text-sm text-muted-foreground">
        Point: <strong>NOT_APPLICABLE</strong> — sem terminais físicos configurados.
      </p>
    </div>
  );
}
