import "server-only";
import { prisma } from "@/lib/prisma";
import { AI_COMMERCE_PRODUCTS } from "./catalog";
import { getCatalogBySku } from "@/lib/pricing/catalog";
import { areAiCommercePricesConfirmed } from "./flags";

export async function ensureAiCommerceProducts() {
  for (const def of AI_COMMERCE_PRODUCTS) {
    const catalog = getCatalogBySku(def.sku);
    const amountCents = catalog?.amountCents ?? 0;
    const source = def.priceSource;
    const existing = await prisma.aIProduct.findUnique({ where: { sku: def.sku } });
    const product = existing
      ? await prisma.aIProduct.update({
          where: { sku: def.sku },
          data: {
            slug: def.slug,
            name: def.name,
            shortDescription: def.shortDescription,
            longDescription: def.longDescription,
            category: def.category,
            billingType: def.billingType,
            usageLimit: def.usageLimit,
            capabilityId: def.capabilityId,
            sortOrder: AI_COMMERCE_PRODUCTS.findIndex((p) => p.sku === def.sku),
            maxImages: def.maxImages,
            maxFiles: def.maxFiles,
            avgFillMinutes: def.avgFillMinutes,
            status: existing.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
          },
        })
      : await prisma.aIProduct.create({
          data: {
            sku: def.sku,
            slug: def.slug,
            name: def.name,
            shortDescription: def.shortDescription,
            longDescription: def.longDescription,
            category: def.category,
            billingType: def.billingType,
            usageLimit: def.usageLimit,
            capabilityId: def.capabilityId,
            sortOrder: AI_COMMERCE_PRODUCTS.findIndex((p) => p.sku === def.sku),
            maxImages: def.maxImages,
            maxFiles: def.maxFiles,
            avgFillMinutes: def.avgFillMinutes,
            status: "ACTIVE",
          },
        });

    const active = await prisma.aIProductPrice.findFirst({
      where: { productId: product.id, active: true },
      orderBy: { version: "desc" },
    });
    const shouldWrite =
      amountCents > 0 &&
      (!active ||
        (active.source !== "ADMIN_CONFIRMED" &&
          (active.priceInCents !== amountCents || active.source !== source)));
    if (shouldWrite) {
      if (active) {
        await prisma.aIProductPrice.update({
          where: { id: active.id },
          data: { active: false, endsAt: new Date() },
        });
      }
      await prisma.aIProductPrice.create({
        data: {
          productId: product.id,
          priceInCents: amountCents,
          currency: "BRL",
          version: (active?.version ?? 0) + 1,
          active: true,
          source: areAiCommercePricesConfirmed() ? "ADMIN_CONFIRMED" : source,
          reference: def.priceReference,
          billingType: def.billingType,
          usageLimit: def.usageLimit,
        },
      });
    }
  }
}

export async function getPublicProductBySlug(slug: string) {
  await ensureAiCommerceProducts();
  const normalized = slug === "lab" ? "exames" : slug;
  return prisma.aIProduct.findUnique({
    where: { slug: normalized },
    include: {
      prices: { where: { active: true }, orderBy: { version: "desc" }, take: 1 },
    },
  });
}
