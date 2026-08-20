import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const version = await prisma.pricingVersion.findFirst({
  where: { version: "BR-2026.08-v1", country: "BR" },
});
if (!version) {
  console.error("PricingVersion BR-2026.08-v1 ausente");
  process.exit(1);
}
const sku = await prisma.pricingCatalogItem.count({ where: { versionId: version.id } });
const rules = await prisma.pricingRule.count({ where: { versionId: version.id } });
const grouped = await prisma.pricingCatalogItem.groupBy({
  by: ["sku"],
  where: { versionId: version.id },
  _count: true,
});
const duplicates = grouped.filter((g) => g._count > 1).length;
console.log(
  JSON.stringify(
    {
      id: version.id,
      version: version.version,
      status: version.status,
      sku,
      rules,
      duplicates,
    },
    null,
    2
  )
);
if (version.status !== "ACTIVE" || sku !== 204 || duplicates > 0) process.exit(1);
await prisma.$disconnect();
