"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Wrench, Loader2, MessageCircle } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { fetchOrders, type Order } from "@/lib/orders/api";
import { fetchPartnerOrders } from "@/lib/marketplace/partner-api";
import { api } from "@/lib/api";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  PROCESSING: "Em separação",
  READY_PICKUP: "Pronto para retirada",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  PICKED_UP: "Retirado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

function OrderCard({ order, isPartner }: { order: Order & { user?: { name: string } }; isPartner?: boolean }) {
  const last = order.statusHistory[order.statusHistory.length - 1];
  return (
    <Card className="card-premium">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Pedido #{order.orderNumber}</span>
          <Badge>{STATUS_LABEL[order.status] ?? order.status}</Badge>
        </div>
        {isPartner && order.user && <p className="text-sm text-ecopet-gray">Cliente: {order.user.name}</p>}
        <p className="text-sm">Total: R$ {order.total.toFixed(2)}</p>
        <ul className="text-xs text-ecopet-gray space-y-1">
          {order.items.map((i) => (
            <li key={i.id}>{i.quantity}x {i.name}</li>
          ))}
        </ul>
        {last?.note && <p className="text-xs italic">{last.note}</p>}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/social/mensagens"><MessageCircle className="h-3 w-3 mr-1" /> Chat</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PedidosPage() {
  const { user, token } = useCurrentUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<{ id: string; description: string; status: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const isPartner = Boolean(user && ["PETSHOP", "SELLER", "SERVICE_PROVIDER", "VETERINARIAN", "CLINIC", "PARTNER"].includes(user.role ?? ""));

  useEffect(() => {
    if (!token) return;
    const authToken = token;
    async function load() {
      setLoading(true);
      try {
        if (isPartner) {
          setOrders(await fetchPartnerOrders(authToken));
        } else {
          setOrders(await fetchOrders());
          const reqs = await api<{ id: string; description: string; status: string; createdAt: string }[]>("/api/services/custom/mine", { token: authToken });
          setServiceRequests(reqs);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [token, isPartner]);

  if (!user) {
    return (
      <>
        <AppHeader title="Meus Pedidos e Serviços" />
        <main className="mx-auto max-w-4xl flex-1 p-6 text-center text-sm">Faça login para acompanhar pedidos e serviços.</main>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Meus Pedidos e Serviços" />
      <main className="mx-auto max-w-4xl flex-1 space-y-6 p-4 lg:p-6">
        <div>
          <h1 className="heading-2">{isPartner ? "Pedidos recebidos" : "Meus Pedidos e Serviços"}</h1>
          <p className="secondary-text">Acompanhamento filtrado pela sua conta</p>
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm">
          Pagamento real será ativado na fase de integração financeira. Homologação em modo demonstração.
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-ecopet-green" /></div>
        ) : (
          <>
            <section>
              <h2 className="section-title flex items-center gap-2 mb-3"><Package className="h-4 w-4" /> Produtos</h2>
              {orders.length === 0 ? (
                <Card className="border-dashed"><CardContent className="p-6 text-center text-sm text-ecopet-gray">Nenhum pedido encontrado.</CardContent></Card>
              ) : (
                <div className="grid gap-4">{orders.map((o) => <OrderCard key={o.id} order={o as Order & { user?: { name: string } }} isPartner={isPartner} />)}</div>
              )}
            </section>

            {!isPartner && (
              <section>
                <h2 className="section-title flex items-center gap-2 mb-3"><Wrench className="h-4 w-4" /> Serviços solicitados</h2>
                {serviceRequests.length === 0 ? (
                  <Card className="border-dashed"><CardContent className="p-6 text-center text-sm text-ecopet-gray">Nenhum serviço solicitado.</CardContent></Card>
                ) : (
                  <div className="grid gap-3">
                    {serviceRequests.map((r) => (
                      <Card key={r.id}><CardContent className="p-4">
                        <div className="flex justify-between"><Badge>{r.status}</Badge><span className="text-xs text-ecopet-gray">{new Date(r.createdAt).toLocaleDateString("pt-BR")}</span></div>
                        <p className="mt-2 text-sm">{r.description}</p>
                      </CardContent></Card>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
