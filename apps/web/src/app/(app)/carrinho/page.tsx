import Link from "next/link";
import { CartPanel } from "@/components/features/marketplace/cart-panel";

export default function CarrinhoPage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Carrinho</h1>
      <CartPanel />
      <Link href="/produtos" className="mt-4 inline-block text-sm underline">Continuar comprando</Link>
    </main>
  );
}
