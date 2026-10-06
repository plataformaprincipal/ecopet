import { ClientOrdersHub } from "@/components/features/marketplace/client-orders-hub";

export default function ClientOrdersRoute() {
  return (
    <main className="mx-auto max-w-3xl p-4 lg:p-8">
      <h1 className="mb-4 font-display text-2xl font-semibold">Meus pedidos</h1>
      <ClientOrdersHub />
    </main>
  );
}
