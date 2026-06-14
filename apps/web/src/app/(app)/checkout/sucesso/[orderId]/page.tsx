import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PageProps = { params: Promise<{ orderId: string }> };

export default async function CheckoutSuccessPage({ params }: PageProps) {
  const { orderId } = await params;
  return (
    <main className="mx-auto max-w-lg p-6">
      <Card>
        <CardContent className="space-y-4 p-6 text-center">
          <h1 className="text-2xl font-semibold">Pedido registrado</h1>
          <p className="text-sm text-muted-foreground">
            Seu pedido foi criado com sucesso. O pagamento será integrado em uma etapa futura.
          </p>
          <p className="text-xs text-muted-foreground">ID: {orderId}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild><Link href="/dashboard/client/orders">Meus pedidos</Link></Button>
            <Button asChild variant="outline"><Link href="/produtos">Continuar comprando</Link></Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
