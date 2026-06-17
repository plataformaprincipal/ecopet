#!/usr/bin/env node
/**
 * Bootstrap idempotente do catálogo institucional EcoPet.
 * Uso: npm run bootstrap:catalog
 */
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import {
  PrismaClient,
  UserRole,
  AccountStatus,
  ProductCatalogStatus,
  ProductCatalogCategory,
  ContentApprovalStatus,
  PartnerServiceStatus,
  VerificationStatus,
  ServiceModality,
  ReadyServiceCategory,
} from "@prisma/client";

const prisma = new PrismaClient();

const CATALOG_EMAIL = "catalogo@ecopet.local";
const CATALOG_CNPJ = "11222333000181";
const CATALOG_BUSINESS = "EcoPet Oficial";

const CATALOG_IMAGE_BASE = "/catalog/ecopet-oficial";

const PRODUCTS = [
  {
    sku: "ECOPET-ACC-CAMISA",
    name: "Camiseta Pet Básica Conforto",
    imageUrl: `${CATALOG_IMAGE_BASE}/camiseta-pet.svg`,
    imageAlt: "Camiseta pet básica confortável para cães e gatos de pequeno e médio porte",
    catalogCategory: ProductCatalogCategory.ACCESSORIES,
    subcategory: "Roupa",
    price: 39.9,
    stock: 30,
    shortDescription: "Roupa leve e confortável para cães e gatos de pequeno e médio porte.",
    description:
      "Camiseta pet em tecido macio, indicada para uso diário, passeios e proteção leve contra frio moderado. Modelo simples, fácil de vestir, com boa mobilidade.",
    weightGrams: 150,
    extraDetails: {
      speciesTargets: ["cão", "gato"],
      sizeTarget: "pequeno, médio",
      observations: "Tamanhos: P, M, G. Cor: variada.",
    },
  },
  {
    sku: "ECOPET-ACC-BRINQUEDO",
    name: "Brinquedo Mordedor Interativo",
    imageUrl: `${CATALOG_IMAGE_BASE}/brinquedo-mordedor.svg`,
    imageAlt: "Brinquedo mordedor interativo de borracha para cães",
    catalogCategory: ProductCatalogCategory.ACCESSORIES,
    subcategory: "Brinquedos",
    price: 24.9,
    stock: 50,
    shortDescription: "Mordedor resistente para distração e enriquecimento ambiental.",
    description:
      "Brinquedo indicado para cães, auxilia na distração, gasto de energia e estímulo mental. Material resistente para uso supervisionado.",
    extraDetails: {
      speciesTargets: ["cão"],
      sizeTarget: "pequeno, médio, grande",
      composition: "borracha atóxica",
    },
  },
  {
    sku: "ECOPET-ACC-CAMA",
    name: "Cama Pet Almofadada Lavável",
    imageUrl: `${CATALOG_IMAGE_BASE}/cama-pet.svg`,
    imageAlt: "Cama pet almofadada lavável para cães e gatos",
    catalogCategory: ProductCatalogCategory.ACCESSORIES,
    subcategory: "Cama",
    price: 89.9,
    stock: 20,
    shortDescription: "Cama confortável, lavável e indicada para descanso diário.",
    description:
      "Cama almofadada para cães e gatos, com tecido confortável e base macia. Indicada para uso interno, descanso e recuperação do pet.",
    dimensions: { widthCm: 60, heightCm: 15, depthCm: 45 },
    extraDetails: {
      speciesTargets: ["cão", "gato"],
      sizeTarget: "pequeno, médio",
    },
  },
  {
    sku: "ECOPET-FOOD-CAO-10KG",
    name: "Ração Seca Premium Cães Adultos 10kg",
    imageUrl: `${CATALOG_IMAGE_BASE}/racao-caes.svg`,
    imageAlt: "Saco de ração seca premium para cães adultos",
    catalogCategory: ProductCatalogCategory.FOOD,
    subcategory: "Cachorro",
    price: 149.9,
    stock: 25,
    unit: "kg",
    weightGrams: 10000,
    shortDescription: "Ração seca premium para cães adultos.",
    description:
      "Alimento seco completo para cães adultos, indicado para manutenção da saúde, energia diária e nutrição balanceada. Produto não perecível dentro do prazo de validade.",
    extraDetails: {
      speciesTargets: ["cão"],
      expiryDate: "Validade mínima: 6 meses",
    },
  },
  {
    sku: "ECOPET-FOOD-GATO-3KG",
    name: "Ração Seca Premium Gatos Adultos 3kg",
    imageUrl: `${CATALOG_IMAGE_BASE}/racao-gatos.svg`,
    imageAlt: "Saco de ração seca premium para gatos adultos",
    catalogCategory: ProductCatalogCategory.FOOD,
    subcategory: "Gato",
    price: 79.9,
    stock: 35,
    unit: "kg",
    weightGrams: 3000,
    shortDescription: "Ração seca premium para gatos adultos.",
    description:
      "Alimento seco completo para gatos adultos, com composição balanceada para rotina diária. Produto não perecível dentro do prazo de validade.",
    extraDetails: {
      speciesTargets: ["gato"],
      expiryDate: "Validade mínima: 6 meses",
    },
  },
  {
    sku: "ECOPET-HIG-TAPETE",
    name: "Tapete Higiênico Superabsorvente 30 unidades",
    imageUrl: `${CATALOG_IMAGE_BASE}/tapete-higienico.svg`,
    imageAlt: "Pacote de tapete higiênico superabsorvente para cães",
    catalogCategory: ProductCatalogCategory.HYGIENE,
    subcategory: "Tapete higiênico",
    price: 59.9,
    stock: 40,
    shortDescription: "Tapete higiênico descartável para cães.",
    description:
      "Tapete higiênico com camada absorvente, indicado para treinamento sanitário, filhotes, cães idosos e uso em ambientes internos.",
    extraDetails: {
      speciesTargets: ["cão"],
      observations: "Quantidade: 30 unidades",
    },
  },
  {
    sku: "ECOPET-HIG-FRALDA",
    name: "Fralda Pet Descartável Ajustável 12 unidades",
    imageUrl: `${CATALOG_IMAGE_BASE}/fralda-pet.svg`,
    imageAlt: "Fralda pet descartável ajustável para cães e gatos",
    catalogCategory: ProductCatalogCategory.HYGIENE,
    subcategory: "Fraldas",
    price: 44.9,
    stock: 30,
    shortDescription: "Fralda descartável ajustável para cães e gatos.",
    description:
      "Fralda indicada para pets idosos, incontinência urinária, pós-operatório, viagens e situações específicas de manejo. Uso supervisionado.",
    extraDetails: {
      speciesTargets: ["cão", "gato"],
      observations: "Quantidade: 12 unidades. Tamanhos: P, M, G.",
    },
  },
];

const SERVICES = [
  {
    catalogKey: "ecopet-svc-banho",
    name: "Banho Pet",
    imageUrl: `${CATALOG_IMAGE_BASE}/banho-pet.svg`,
    imageAlt: "Serviço de banho pet com agendamento para cães e gatos",
    category: ReadyServiceCategory.BATH_GROOMING,
    subcategory: "Banho",
    price: 59.9,
    durationMin: 60,
    shortDescription: "Banho completo com agendamento.",
    description:
      "Serviço de banho para cães e gatos, com higienização adequada, secagem e cuidado básico. O atendimento pode ocorrer com tele-busca ou entrega do pet no local.",
    extraDetails: {
      attendanceModes: ["TELEBUSCA", "TUTOR_DELIVERY"],
      observations: "Modalidades: Tele-busca do pet ou Entrega do pet no local.",
    },
  },
  {
    catalogKey: "ecopet-svc-tosa",
    name: "Tosa Pet",
    imageUrl: `${CATALOG_IMAGE_BASE}/tosa-pet.svg`,
    imageAlt: "Serviço de tosa pet com agendamento para cães e gatos",
    category: ReadyServiceCategory.BATH_GROOMING,
    subcategory: "Tosa",
    price: 89.9,
    durationMin: 90,
    shortDescription: "Tosa estética ou higiênica com agendamento.",
    description:
      "Serviço de tosa para cães e gatos, conforme necessidade do pet. Pode incluir tosa higiênica, aparo básico e acabamento. Atendimento mediante agendamento.",
    extraDetails: {
      attendanceModes: ["TELEBUSCA", "TUTOR_DELIVERY"],
      observations: "Modalidades: Tele-busca do pet ou Entrega do pet no local.",
    },
  },
];

const AVAILABILITY_WEEKDAYS = [1, 2, 3, 4, 5, 6];

async function ensurePartner(db) {
  let user = await db.user.findUnique({ where: { email: CATALOG_EMAIL } });

  if (!user) {
    const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
    user = await db.user.create({
      data: {
        email: CATALOG_EMAIL,
        name: CATALOG_BUSINESS,
        passwordHash,
        role: UserRole.PARTNER,
        accountStatus: AccountStatus.ACTIVE,
        phone: "00000000000",
        cnpj: CATALOG_CNPJ,
        isBootstrapUser: true,
        preferences: { institutionalCatalogPartner: true, publicLoginDisabled: true },
      },
    });
    console.log("✓ Parceiro institucional criado:", user.id);
  } else {
    user = await db.user.update({
      where: { id: user.id },
      data: {
        accountStatus: AccountStatus.ACTIVE,
        isBootstrapUser: true,
        preferences: { institutionalCatalogPartner: true, publicLoginDisabled: true },
      },
    });
    console.log("✓ Parceiro institucional reutilizado:", user.id);
  }

  const profile = await db.partnerProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      businessName: CATALOG_BUSINESS,
      legalName: "EcoPet Plataforma Digital LTDA",
      cnpj: CATALOG_CNPJ,
      category: "Plataforma institucional",
      address: "Av. Paulista, 1000",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-100",
      commercialEmail: CATALOG_EMAIL,
      responsibleName: "EcoPet",
      description: "Catálogo oficial operacional da plataforma EcoPet.",
      businessHours: "Segunda a sábado, 08:00 às 18:00",
      verificationStatus: VerificationStatus.APPROVED,
    },
    update: {
      businessName: CATALOG_BUSINESS,
      verificationStatus: VerificationStatus.APPROVED,
      description: "Catálogo oficial operacional da plataforma EcoPet.",
      businessHours: "Segunda a sábado, 08:00 às 18:00",
    },
  });

  return { user, profile };
}

async function upsertProducts(db, sellerId) {
  let created = 0;
  let updated = 0;

  for (const def of PRODUCTS) {
    const existing = await db.product.findFirst({ where: { sellerId, sku: def.sku } });
    const payload = {
      name: def.name,
      description: def.description,
      shortDescription: def.shortDescription,
      subcategory: def.subcategory,
      catalogCategory: def.catalogCategory,
      price: def.price,
      stock: def.stock,
      unit: def.unit ?? null,
      weightGrams: def.weightGrams ?? null,
      dimensions: def.dimensions ?? undefined,
      extraDetails: { ...def.extraDetails, imageAlt: def.imageAlt },
      images: [def.imageUrl],
      status: ProductCatalogStatus.ACTIVE,
      approvalStatus: ContentApprovalStatus.APPROVED,
      pickupAvailable: true,
      deliveryAvailable: true,
      deletedAt: null,
    };

    if (existing) {
      await db.product.update({ where: { id: existing.id }, data: payload });
      updated++;
    } else {
      const product = await db.product.create({ data: { sellerId, sku: def.sku, ...payload } });
      if (product.stock > 0) {
        await db.inventoryLog.create({
          data: {
            productId: product.id,
            partnerId: sellerId,
            delta: product.stock,
            stockAfter: product.stock,
            reason: "Catálogo inicial EcoPet",
            actorId: sellerId,
          },
        });
      }
      created++;
    }
  }

  return { created, updated };
}

async function upsertServices(db, providerId) {
  let created = 0;
  let updated = 0;

  for (const def of SERVICES) {
    const existing = await db.service.findMany({
      where: { providerId, deletedAt: null },
    });
    const match = existing.find((s) => {
      const extra = s.extraDetails;
      const key = extra && typeof extra === "object" ? extra.catalogKey : undefined;
      return key === def.catalogKey || s.name === def.name;
    });

    const payload = {
      name: def.name,
      description: def.description,
      shortDescription: def.shortDescription,
      subcategory: def.subcategory,
      category: def.category,
      price: def.price,
      durationMin: def.durationMin,
      status: PartnerServiceStatus.ACTIVE,
      isActive: true,
      approvalStatus: ContentApprovalStatus.APPROVED,
      modality: ServiceModality.PICKUP_DELIVERY,
      city: "São Paulo",
      state: "SP",
      serviceLocation: "EcoPet Oficial — São Paulo/SP",
      image: def.imageUrl,
      extraDetails: { catalogKey: def.catalogKey, ...def.extraDetails, imageAlt: def.imageAlt },
      deletedAt: null,
    };

    if (match) {
      await db.service.update({ where: { id: match.id }, data: payload });
      updated++;
    } else {
      await db.service.create({ data: { providerId, type: "READY_SERVICE", ...payload } });
      created++;
    }
  }

  return { created, updated };
}

async function ensureAvailability(db, partnerId) {
  for (const weekday of AVAILABILITY_WEEKDAYS) {
    const existing = await db.partnerAvailability.findFirst({ where: { partnerId, weekday } });
    const data = {
      partnerId,
      weekday,
      startTime: "08:00",
      endTime: "18:00",
      intervalMinutes: 60,
      isActive: true,
    };
    if (existing) {
      await db.partnerAvailability.update({ where: { id: existing.id }, data });
    } else {
      await db.partnerAvailability.create({ data });
    }
  }
}

async function main() {
  console.log("=== EcoPet Bootstrap Catálogo ===\n");

  const { user } = await ensurePartner(prisma);
  const products = await upsertProducts(prisma, user.id);
  const services = await upsertServices(prisma, user.id);
  await ensureAvailability(prisma, user.id);

  const productCount = await prisma.product.count({
    where: { sellerId: user.id, sku: { in: PRODUCTS.map((p) => p.sku) }, deletedAt: null },
  });
  const serviceCount = await prisma.service.count({
    where: { providerId: user.id, deletedAt: null, status: PartnerServiceStatus.ACTIVE },
  });

  console.log(`\nProdutos: ${productCount} no catálogo (${products.created} criados, ${products.updated} atualizados)`);
  console.log(`Serviços: ${serviceCount} ativos (${services.created} criados, ${services.updated} atualizados)`);
  console.log(`Imagens: ${PRODUCTS.length} produtos + ${SERVICES.length} serviços em /catalog/ecopet-oficial/`);
  console.log(`Disponibilidade: seg–sáb 08:00–18:00 (a partir de amanhã)`);
  console.log("\n✓ Bootstrap do catálogo concluído (idempotente).");
}

main()
  .catch((e) => {
    console.error("✗", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
