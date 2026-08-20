import { PrismaClient } from "@prisma/client";
import { seedRbac } from "./seed-rbac.js";
import { seedOfficialPricing } from "./seed-pricing.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 EcoPet seed — banco inicia sem dados fictícios de demonstração.");
  await seedRbac(prisma);
  console.log("✅ RBAC estrutural aplicado (sem usuários, pets, produtos ou posts fake).");
  const pricing = await seedOfficialPricing(prisma);
  console.log(`✅ Pricing oficial ${pricing.versionId} com ${pricing.skuCount} SKUs (idempotente).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
