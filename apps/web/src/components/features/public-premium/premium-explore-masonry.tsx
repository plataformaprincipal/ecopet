"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/design-system/motion";

type MasonryItem = {
  id: string;
  type: "partner" | "service" | "product";
  title: string;
  subtitle?: string;
  href: string;
  price?: string;
  tall?: boolean;
};

type PremiumExploreMasonryProps = {
  partners: Array<{ id: string; name: string; category?: string | null; city?: string | null }>;
  services: Array<{ id: string; name: string; price: number; category: string }>;
  products: Array<{ id: string; name: string; price: number }>;
  formatPrice: (n: number) => string;
};

export function PremiumExploreMasonry({
  partners,
  services,
  products,
  formatPrice,
}: PremiumExploreMasonryProps) {
  const items: MasonryItem[] = [
    ...partners.map((p, i) => ({
      id: `p-${p.id}`,
      type: "partner" as const,
      title: p.name,
      subtitle: [p.category, p.city].filter(Boolean).join(" · ") || "Parceiro",
      href: `/parceiros/${p.id}`,
      tall: i % 3 === 0,
    })),
    ...services.map((s, i) => ({
      id: `s-${s.id}`,
      type: "service" as const,
      title: s.name,
      subtitle: s.category,
      href: `/marketplace/servico/${s.id}`,
      price: formatPrice(s.price),
      tall: i % 4 === 1,
    })),
    ...products.map((p, i) => ({
      id: `pr-${p.id}`,
      type: "product" as const,
      title: p.name,
      subtitle: "Produto",
      href: `/marketplace/produto/${p.id}`,
      price: formatPrice(p.price),
      tall: i % 5 === 2,
    })),
  ];

  if (items.length === 0) return null;

  return (
    <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
      {items.map((item, index) => (
        <FadeIn key={item.id} delay={index * 0.03} className="mb-4 break-inside-avoid">
          <Link
            href={item.href}
            className={cn(
              "group card-premium block overflow-hidden rounded-2xl p-0",
              item.tall ? "min-h-[200px]" : "min-h-[140px]"
            )}
          >
            <div className="relative h-28 w-full bg-gradient-to-br from-ecopet-green/20 to-ecopet-cream dark:from-ecopet-green/30 dark:to-ecopet-dark-card">
              <Image
                src={`https://images.unsplash.com/photo-${item.type === "partner" ? "1587300003388-59208cc962cb" : item.type === "service" ? "1601758228041-f3b2795255f1" : "1583339793403-21d4974d32d9"}?auto=format&fit=crop&w=400&q=60`}
                alt=""
                fill
                className="object-cover opacity-80 transition group-hover:scale-105"
                sizes="200px"
              />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ecopet-dark">
                {item.type === "partner" ? "Parceiro" : item.type === "service" ? "Serviço" : "Produto"}
              </span>
            </div>
            <div className="p-4">
              <p className="font-medium text-ecopet-dark dark:text-white">{item.title}</p>
              {item.subtitle && (
                <p className="mt-1 text-xs text-ecopet-gray dark:text-white/60">{item.subtitle}</p>
              )}
              {item.price && (
                <p className="mt-2 text-sm font-semibold text-ecopet-green">{item.price}</p>
              )}
            </div>
          </Link>
        </FadeIn>
      ))}
    </div>
  );
}
