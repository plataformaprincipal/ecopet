import { MercadoPagoHubPanel } from "@/components/features/admin/mercado-pago-hub-panel";

export default function AdminMpAssinaturasPage() {
  return (
    <div className="space-y-2">
      <MercadoPagoHubPanel />
      <p className="px-6 text-sm text-muted-foreground">
        Planos e assinaturas MP: <strong>NOT_APPLICABLE</strong> — recorrência não ativada. Eventos
        são persistidos sem cobrança.
      </p>
    </div>
  );
}
