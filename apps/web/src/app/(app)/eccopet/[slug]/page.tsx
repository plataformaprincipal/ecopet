import type { Metadata } from "next";
import { AiProductPage } from "@/components/features/ai-commerce/product-page";
import { getProductDefBySlug } from "@/lib/ai-commerce/catalog";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const def = getProductDefBySlug(slug);
  if (!def) return { title: "EccoPet AI", robots: { index: false } };
  return {
    title: `${def.name} — EccoPet AI`,
    description: def.shortDescription,
    alternates: { canonical: def.href },
    openGraph: { title: def.name, description: def.shortDescription, url: def.href },
    robots: { index: true, follow: true },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <AiProductPage slug={slug} />;
}
