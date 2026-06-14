import Link from "next/link";
import { PublicServicesList } from "@/components/features/marketplace/public-services-list";

export default function ServicosPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">Serviços para pets</h1>
      <p className="mb-4 text-sm text-muted-foreground">Encontre serviços reais cadastrados por parceiros aprovados.</p>
      <PublicServicesList />
      <div className="mt-4 flex gap-3 text-sm">
        <Link href="/produtos" className="underline">Ver produtos</Link>
        <Link href="/" className="underline">Início</Link>
      </div>
    </main>
  );
}
