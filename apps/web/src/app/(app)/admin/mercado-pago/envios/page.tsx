import { MercadoPagoHubPanel } from "@/components/features/admin/mercado-pago-hub-panel";

export default function AdminMpEnviosPage() {
  return (
    <div className="space-y-2">
      <MercadoPagoHubPanel />
      <p className="px-6 text-sm text-muted-foreground">
        Envios Mercado Pago: <strong>NOT_APPLICABLE</strong> — EcoPet usa logística do parceiro.
        Eventos de shipment são apenas registrados no catálogo do hub.
      </p>
    </div>
  );
}
