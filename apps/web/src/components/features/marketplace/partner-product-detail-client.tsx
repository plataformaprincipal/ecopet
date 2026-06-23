"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export function ProductCreatedBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("created") !== "1") return null;
  return (
    <p className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
      Produto cadastrado com sucesso.
    </p>
  );
}

export function ProductDetailActions({ productId }: { productId: string }) {
  return (
    <Link href={`/dashboard/partner/products/${productId}/edit`} className="mt-4 inline-block text-sm underline">
      Editar
    </Link>
  );
}
