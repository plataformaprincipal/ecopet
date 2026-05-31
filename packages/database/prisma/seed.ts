import {
  PrismaClient,
  UserRole,
  PetSpecies,
  PetSize,
  SubscriptionPlan,
  ReadyServiceCategory,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedRbac, seedGestorData } from "./seed-rbac.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ECOPET database...");

  const passwordHash = await bcrypt.hash("Ecopet@2026", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ecopet.com.br" },
    update: { accountStatus: "ACTIVE" },
    create: {
      email: "admin@ecopet.com.br",
      passwordHash,
      name: "Admin ECOPET",
      role: UserRole.ADMIN,
      accountStatus: "ACTIVE",
      isVerified: true,
      isPremium: true,
      badges: [],
      adminProfile: {
        create: {
          jobTitle: "Administrador Geral",
          accessLevel: "administrador_geral",
          corporateEmail: "admin@ecopet.com.br",
        },
      },
    },
  });

  const gestor = await prisma.user.upsert({
    where: { email: "gestor@ecopet.com.br" },
    update: { accountStatus: "ACTIVE", role: UserRole.GESTOR },
    create: {
      email: "gestor@ecopet.com.br",
      passwordHash,
      name: "Gestor ECOPET",
      role: UserRole.GESTOR,
      accountStatus: "ACTIVE",
      isVerified: true,
      isPremium: true,
      gestorProfile: {
        create: {
          jobTitle: "Diretor de Operações",
          corporateEmail: "gestor@ecopet.com.br",
          hierarchyLevel: 100,
          employeeCode: "GES-001",
        },
      },
    },
  });

  const masterPasswordHash = await bcrypt.hash("AASSSVVV@1972", 12);
  const gestorMaster = await prisma.user.upsert({
    where: { username: "gestorveras" },
    update: {
      role: UserRole.GESTOR,
      accountStatus: "ACTIVE",
      isBootstrapUser: true,
      isMasterAdmin: false,
      mustChangePassword: false,
      firstLoginRequired: false,
      passwordHash: masterPasswordHash,
    },
    create: {
      email: "gestorveras@ecopet.com.br",
      username: "gestorveras",
      passwordHash: masterPasswordHash,
      name: "Usuário Temporário de Ativação",
      role: UserRole.GESTOR,
      accountStatus: "ACTIVE",
      isVerified: true,
      isBootstrapUser: true,
      isMasterAdmin: false,
      gestorProfile: {
        create: {
          jobTitle: "Bootstrap — Ativação Inicial",
          corporateEmail: "gestorveras@ecopet.com.br",
          hierarchyLevel: 0,
          employeeCode: "BOOTSTRAP",
        },
      },
    },
  });

  await prisma.systemBootstrap.upsert({
    where: { id: "singleton" },
    update: {
      bootstrapUserId: gestorMaster.id,
      bootstrapUsername: "gestorveras",
      bootstrapUsed: false,
      bootstrapUsedAt: null,
      bootstrapDisabled: false,
      masterAdminCreated: false,
      masterAdminUserId: null,
      initializedAt: null,
    },
    create: {
      id: "singleton",
      bootstrapUserId: gestorMaster.id,
      bootstrapUsername: "gestorveras",
    },
  });

  const tutor = await prisma.user.upsert({
    where: { email: "tutor@ecopet.com.br" },
    update: { accountStatus: "ACTIVE" },
    create: {
      email: "tutor@ecopet.com.br",
      passwordHash,
      name: "Maria Silva",
      cpf: "12345678901",
      phone: "(11) 99999-0001",
      role: UserRole.TUTOR,
      accountStatus: "ACTIVE",
      isVerified: true,
      bio: "Amante de pets 🐾 | Tutora da Luna e Thor",
      tutorProfile: {
        create: {
          petCount: 2,
          primaryInterests: ["produtos", "saude", "rede_social"],
        },
      },
      address: {
        create: {
          street: "Av. Paulista",
          number: "1000",
          district: "Bela Vista",
          city: "São Paulo",
          state: "SP",
          zipCode: "01310-100",
        },
      },
      gamification: {
        create: { points: 1250, level: 5, badges: ["early-adopter"] },
      },
    },
  });

  const vet = await prisma.user.upsert({
    where: { email: "vet@ecopet.com.br" },
    update: { accountStatus: "ACTIVE" },
    create: {
      email: "vet@ecopet.com.br",
      passwordHash,
      name: "Dr. Carlos Mendes",
      role: UserRole.VETERINARIAN,
      accountStatus: "ACTIVE",
      isVerified: true,
      badges: [],
      veterinarianProfile: {
        create: {
          crmv: "SP-12345",
          crmvState: "SP",
          specialties: ["Clínica Geral", "Dermatologia"],
          description: "15 anos de experiência em medicina veterinária.",
          experience: 15,
        },
      },
    },
  });

  const petshop = await prisma.user.upsert({
    where: { email: "loja@ecopet.com.br" },
    update: {},
    create: {
      email: "loja@ecopet.com.br",
      passwordHash,
      name: "Pet Shop Amigo",
      role: UserRole.PETSHOP,
      isVerified: true,
      petshopProfile: {
        create: {
          tradeName: "Pet Shop Amigo",
          cnpj: "12345678000199",
          photos: [],
          delivery: true,
          pickup: true,
        },
      },
    },
  });

  let pet = await prisma.pet.findFirst({ where: { ownerId: tutor.id, name: "Luna" } });
  if (!pet) {
    pet = await prisma.pet.create({
      data: {
        ownerId: tutor.id,
        name: "Luna",
        species: PetSpecies.DOG,
        breed: "Golden Retriever",
        size: PetSize.LARGE,
        sex: "F",
        weight: 28.5,
        color: "Dourado",
        neutered: true,
        behavior: "Dócil e brincalhona",
        diet: "Ração premium + petiscos naturais",
        activityLevel: "Alto",
        vaccinations: {
          create: [
            { name: "V10", date: new Date("2025-06-15"), nextDue: new Date("2026-06-15") },
            { name: "Antirrábica", date: new Date("2025-08-01"), nextDue: new Date("2026-08-01") },
          ],
        },
      },
    });
  }

  const categoryDefs = [
    { name: "Rações", slug: "racoes", icon: "🍖" },
    { name: "Acessórios", slug: "acessorios", icon: "🦴" },
    { name: "Higiene", slug: "higiene", icon: "🛁" },
    { name: "Saúde", slug: "saude", icon: "💊" },
    { name: "Brinquedos", slug: "brinquedos", icon: "🎾" },
    { name: "Assinatura Pet", slug: "assinatura-pet", icon: "📦" },
  ];

  const categories = await Promise.all(
    categoryDefs.map((c) =>
      prisma.productCategory.upsert({
        where: { slug: c.slug },
        update: { name: c.name, icon: c.icon },
        create: c,
      })
    )
  );

  const slugToId = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  await prisma.product.deleteMany({});
  const products = [
    {
      name: "Ração Premium Golden Adult 15kg",
      description: "Ração super premium para cães adultos de porte grande.",
      price: 189.9,
      images: ["https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400"],
      stock: 50,
      categoryId: slugToId.racoes,
    },
    {
      name: "Coleira Ajustável ECOPET",
      description: "Coleira confortável com fecho de segurança.",
      price: 49.9,
      images: ["https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400"],
      stock: 80,
      categoryId: slugToId.acessorios,
    },
    {
      name: "Shampoo Hipoalergênico",
      description: "Limpeza suave para peles sensíveis.",
      price: 29.9,
      images: ["https://images.unsplash.com/photo-1583337130417-3346a1be690d?w=400"],
      stock: 60,
      categoryId: slugToId.higiene,
    },
    {
      name: "Suplemento Articular Pet",
      description: "Suplemento com glucosamina para articulações saudáveis.",
      price: 79.9,
      images: ["https://images.unsplash.com/photo-1628009368232-7bb8c9314f13?w=400"],
      stock: 30,
      categoryId: slugToId.saude,
      isSponsored: true,
    },
    {
      name: "Brinquedo Mordedor Natural",
      description: "Mordedor 100% natural, ideal para higiene dental.",
      price: 34.9,
      images: ["https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=400"],
      stock: 120,
      categoryId: slugToId.brinquedos,
    },
    {
      name: "Box Mensal ECOPET Premium",
      description: "Assinatura com ração, petiscos e surpresas todo mês.",
      price: 99.9,
      images: ["https://images.unsplash.com/photo-1450778862550-ef9a9458b495?w=400"],
      stock: 999,
      categoryId: slugToId["assinatura-pet"],
    },
  ];

  for (const p of products) {
    await prisma.product.create({ data: { ...p, sellerId: petshop.id } });
  }

  await prisma.service.deleteMany({});
  const readyServices: {
    category: ReadyServiceCategory;
    name: string;
    description: string;
    price: number;
    durationMin: number;
    image: string;
    providerId: string;
  }[] = [
    {
      category: "BATH_GROOMING",
      name: "Banho e Tosa Completa",
      description: "Banho, secagem, tosa higiênica e perfume.",
      price: 89.9,
      durationMin: 90,
      image: "https://images.unsplash.com/photo-1516734212186-a967fbfad1e6?w=400",
      providerId: petshop.id,
    },
    {
      category: "VET_CONSULTATION",
      name: "Consulta Veterinária",
      description: "Avaliação clínica completa com veterinário credenciado.",
      price: 150,
      durationMin: 40,
      image: "https://images.unsplash.com/photo-1629909613654-28e377b87cf8?w=400",
      providerId: vet.id,
    },
    {
      category: "VACCINATION",
      name: "Pacote Vacinação V10",
      description: "Aplicação de vacina múltipla com orientação pós-vacina.",
      price: 120,
      durationMin: 30,
      image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c76?w=400",
      providerId: vet.id,
    },
    {
      category: "DOG_WALKER",
      name: "Dog Walker 1h",
      description: "Passeio monitorado com relatório ao tutor.",
      price: 45,
      durationMin: 60,
      image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
      providerId: petshop.id,
    },
    {
      category: "PET_SITTER",
      name: "Pet Sitter — Diária",
      description: "Cuidado domiciliar durante o dia.",
      price: 95,
      durationMin: 480,
      image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400",
      providerId: petshop.id,
    },
    {
      category: "TRAINING",
      name: "Adestramento Básico",
      description: "4 sessões de obediência e socialização.",
      price: 320,
      durationMin: 60,
      image: "https://images.unsplash.com/photo-1530281700549-e82e7b8f5a6a?w=400",
      providerId: petshop.id,
    },
    {
      category: "BOARDING",
      name: "Hospedagem Pet — 1 noite",
      description: "Estadia confortável com alimentação e recreação.",
      price: 110,
      durationMin: 1440,
      image: "https://images.unsplash.com/photo-1450778862550-ef9a9458b495?w=400",
      providerId: petshop.id,
    },
    {
      category: "PET_TRANSPORT",
      name: "Transporte Pet Urbano",
      description: "Translado seguro com caixa higienizada.",
      price: 65,
      durationMin: 45,
      image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
      providerId: petshop.id,
    },
  ];

  for (const s of readyServices) {
    await prisma.service.create({
      data: { type: "READY_SERVICE", ...s },
    });
  }

  await prisma.post.deleteMany({});
  const feedPosts = [
    {
      authorId: tutor.id,
      petId: pet.id,
      content: "Dia de parque com a Luna! 🐕 #ecopet #goldenretriever #petlovers",
      mediaUrls: ["https://images.unsplash.com/photo-1552053831-71594a27632d?w=600"],
      tags: ["ecopet", "goldenretriever", "petlovers"],
    },
    {
      authorId: tutor.id,
      petId: pet.id,
      content: "Treino de obediência rendendo frutos! 🎾 #ecopet #dogtraining",
      mediaUrls: ["https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600"],
      tags: ["ecopet", "dogtraining"],
    },
    {
      authorId: vet.id,
      content: "Dica do dia: mantenha a carteira de vacinação sempre atualizada! 💉 #saudepet",
      mediaUrls: ["https://images.unsplash.com/photo-1629909613654-28e377b87cf8?w=600"],
      tags: ["saudepet", "ecopet"],
    },
    {
      authorId: petshop.id,
      content: "Promoção de ração premium esta semana na ECOPET! 🛒 #marketplace #ecopet",
      mediaUrls: ["https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600"],
      tags: ["marketplace", "ecopet"],
    },
  ];

  for (const fp of feedPosts) {
    const { tags, ...postData } = fp;
    await prisma.post.create({
      data: {
        ...postData,
        type: "PHOTO",
        hashtags: {
          create: tags.map((tag) => ({
            hashtag: { connectOrCreate: { where: { tag }, create: { tag } } },
          })),
        },
      },
    });
  }

  const adoptionCount = await prisma.adoptionListing.count();
  if (adoptionCount === 0) {
    await prisma.adoptionListing.create({
      data: {
        ongId: admin.id,
        name: "Mel",
        species: PetSpecies.CAT,
        breed: "SRD",
        age: "2 anos",
        photos: ["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400"],
        description: "Mel é uma gatinha carinhosa procurando um lar amoroso.",
        requirements: "Ambiente interno, sem outros gatos agressivos.",
      },
    });
  }

  const sub = await prisma.subscription.findFirst({ where: { userId: tutor.id } });
  if (!sub) {
    await prisma.subscription.create({
      data: { userId: tutor.id, plan: SubscriptionPlan.PREMIUM, active: true },
    });
  }

  console.log("✅ Seed completed!");
  console.log(`   Posts no feed: ${feedPosts.length}`);
  console.log(`   Produtos: ${products.length}`);
  console.log(`   Serviços prontos: ${readyServices.length}`);

  await seedRbac(prisma);
  await seedGestorData(prisma, gestor.id, tutor.id);

  const superRole = await prisma.rbacRole.findUnique({ where: { code: "gestor_super" } });
  if (superRole) {
    const existingMaster = await prisma.systemBootstrap.findUnique({ where: { id: "singleton" } });
    if (!existingMaster?.masterAdminCreated) {
      await prisma.userRbacAssignment.deleteMany({ where: { userId: gestorMaster.id } }).catch(() => {});
    }
  }

  await prisma.product.updateMany({ data: { approvalStatus: "APPROVED" } });
  await prisma.service.updateMany({ data: { approvalStatus: "APPROVED" } });

  // ─── Saldo ECOPET, Logística & Assessoria ───
  const tutorWallet = await prisma.wallet.upsert({
    where: { userId: tutor.id },
    update: { balance: 250 },
    create: { userId: tutor.id, balance: 250 },
  });
  await prisma.walletTransaction.create({
    data: {
      walletId: tutorWallet.id,
      type: "BONUS",
      amount: 250,
      balanceAfter: 250,
      description: "Bônus de boas-vindas ECOPET",
    },
  });

  await prisma.partnerLogisticsConfig.upsert({
    where: { partnerId: petshop.id },
    update: {},
    create: {
      partnerId: petshop.id,
      pickupEnabled: true,
      deliveryLocal: true,
      deliveryRegional: true,
      deliveryNational: true,
      deliveryOwn: true,
      deliveryPartnerLogistics: true,
      scheduledPickup: true,
      scheduledDelivery: true,
      pickupAddress: { street: "Rua dos Pets", number: "500", city: "São Paulo", state: "SP", zipCode: "04101-000" },
      pickupHours: "Seg-Sex 9h-18h, Sáb 9h-13h",
      pickupInstructions: "Apresente QR Code ou documento na recepção.",
      pickupResponsible: "Equipe Pet Shop Amigo",
      mapLat: -23.5505,
      mapLng: -46.6333,
      localDeliveryFee: 12.9,
      regionalDeliveryFee: 24.9,
      nationalDeliveryFee: 39.9,
      carrierPartners: ["Logística ECOPET", "PetExpress"],
    },
  });

  const ong = await prisma.user.upsert({
    where: { email: "ong@ecopet.com.br" },
    update: { accountStatus: "ACTIVE" },
    create: {
      email: "ong@ecopet.com.br",
      passwordHash,
      name: "Instituto Patinhas Felizes",
      role: UserRole.ONG,
      accountStatus: "ACTIVE",
      isVerified: true,
    },
  });

  const partnerSub = await prisma.advisorySubscription.upsert({
    where: { userId: petshop.id },
    update: { active: true },
    create: { userId: petshop.id, planType: "PARTNER_BUSINESS", active: true, features: { iot: true, robots: true, ai: true } },
  });
  const ngoSub = await prisma.advisorySubscription.upsert({
    where: { userId: ong.id },
    update: { active: true },
    create: { userId: ong.id, planType: "NGO_SOCIAL", active: true, features: { iot: true, robots: true, ai: true } },
  });

  const partnerMetrics = [
    { key: "revenue", label: "Receita mensal (R$)", value: 45200, trend: "+14%" },
    { key: "productivity", label: "Produtividade", value: 91, trend: "+5%" },
    { key: "quality", label: "Qualidade (NPS)", value: 88, trend: "+2%" },
    { key: "growth", label: "Crescimento", value: 12, trend: "+12%" },
  ];
  for (const m of partnerMetrics) {
    const exists = await prisma.advisoryMetric.findFirst({ where: { subscriptionId: partnerSub.id, metricKey: m.key } });
    if (!exists) {
      await prisma.advisoryMetric.create({ data: { subscriptionId: partnerSub.id, metricKey: m.key, value: m.value, label: m.label, trend: m.trend } });
    }
  }
  const ngoMetrics = [
    { key: "campaigns", label: "Campanhas ativas", value: 4, trend: "+12%" },
    { key: "donations", label: "Arrecadação (R$)", value: 28500, trend: "+8%" },
    { key: "adoptions", label: "Adoções 2026", value: 18, trend: "+22%" },
  ];
  for (const m of ngoMetrics) {
    const exists = await prisma.advisoryMetric.findFirst({ where: { subscriptionId: ngoSub.id, metricKey: m.key } });
    if (!exists) {
      await prisma.advisoryMetric.create({ data: { subscriptionId: ngoSub.id, metricKey: m.key, value: m.value, label: m.label, trend: m.trend } });
    }
  }

  await prisma.advisoryInsight.createMany({
    data: [
      { subscriptionId: partnerSub.id, category: "estoque", title: "Ruptura prevista em SKUs premium", description: "Robô Estoque identificou 5 itens com estoque crítico.", priority: "high" },
      { subscriptionId: ngoSub.id, category: "campanhas", title: "Campanha de adoção — otimizar alcance", description: "Engajamento 23% abaixo da meta. Reforçar divulgação social.", priority: "medium" },
    ],
    skipDuplicates: true,
  }).catch(() => {});

  console.log("   Bootstrap: gestorveras | Senha: AASSSVVV@1972 (uso único — criar Master Admin)");
  console.log("   Admin: admin@ecopet.com.br | Gestor: gestor@ecopet.com.br | Tutor: tutor@ecopet.com.br");
  console.log("   Parceiro: loja@ecopet.com.br | ONG: ong@ecopet.com.br | Senha: Ecopet@2026");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
