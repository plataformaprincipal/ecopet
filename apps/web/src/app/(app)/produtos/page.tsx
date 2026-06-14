import Link from "next/link";
import { PublicProductsList } from "@/components/features/marketplace/public-products-list";

export default function ProdutosPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Produtos para pets</h1>
      <PublicProductsList />
      <Link href="/servicos" className="mt-4 inline-block text-sm underline">Ver serviços</Link>
    </main>
  );
}
