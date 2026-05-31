import type {
  MarketplacePartner,
  MarketplaceProduct,
  MarketplaceService,
  MarketplaceReview,
  AiRecommendation,
  SubscriptionPlan,
} from "./types";
import { MP_IMAGES } from "./config";

export const MOCK_PARTNERS: MarketplacePartner[] = [
  {
    id: "mp1",
    type: "petshop",
    name: "Pet Shop Amigo",
    tradeName: "Pet Shop Amigo",
    legalName: "Pet Shop Amigo Ltda",
    avatar: MP_IMAGES.shop,
    cover: MP_IMAGES.shop,
    description: "Referência em produtos premium e banho & tosa na Vila Mariana.",
    location: "Vila Mariana, SP",
    distanceKm: 1.2,
    rating: 4.8,
    reviewCount: 342,
    salesCount: 1250,
    responseTime: "~15 min",
    isVerified: true,
    categories: ["Produtos", "Banho e tosa", "Acessórios"],
    hours: "Seg-Sáb 8h-20h",
    policies: {
      delivery: "Entrega em 24-48h na capital. Frete grátis acima de R$99.",
      exchange: "Troca em até 7 dias para produtos lacrados.",
      cancellation: "Cancelamento gratuito até 2h antes do serviço.",
      refund: "Reembolso em até 5 dias úteis.",
      warranty: "Garantia de 90 dias em acessórios.",
    },
    portfolio: [
      { id: "pf1", type: "image", url: MP_IMAGES.grooming, caption: "Antes e depois banho & tosa" },
      { id: "pf2", type: "image", url: MP_IMAGES.shop, caption: "Loja física" },
    ],
    certifications: ["Parceiro ECOPET Verificado", "CRMV parceiro"],
  },
  {
    id: "mp2",
    type: "clinic",
    name: "VetCare Premium",
    tradeName: "VetCare Premium",
    avatar: MP_IMAGES.vet,
    cover: MP_IMAGES.vet,
    description: "Clínica 24h com emergência, exames e cirurgias.",
    location: "Pinheiros, SP",
    distanceKm: 3.5,
    rating: 4.9,
    reviewCount: 890,
    salesCount: 4200,
    responseTime: "~5 min",
    isVerified: true,
    categories: ["Consultas", "Vacinas", "Emergência", "Exames"],
    hours: "24 horas",
    policies: {
      cancellation: "Cancelamento com 4h de antecedência.",
      refund: "Conforme política clínica.",
    },
    portfolio: [
      { id: "pf3", type: "image", url: MP_IMAGES.vet, caption: "Centro cirúrgico" },
    ],
    certifications: ["CRMV", "Anvisa"],
  },
  {
    id: "mp3",
    type: "veterinarian",
    name: "Dr. Carlos Mendes",
    tradeName: "Dr. Carlos Mendes",
    avatar: MP_IMAGES.vet,
    cover: MP_IMAGES.vet,
    description: "15 anos de experiência. Teleconsultas e presencial.",
    location: "São Paulo, SP",
    distanceKm: 2.1,
    rating: 4.95,
    reviewCount: 567,
    salesCount: 2100,
    responseTime: "~10 min",
    isVerified: true,
    categories: ["Consulta", "Dermatologia", "Teleorientação"],
    hours: "Seg-Sex 8h-18h",
    policies: { cancellation: "Reagendamento gratuito 1x." },
    portfolio: [],
    certifications: ["CRMV SP-12345"],
  },
  {
    id: "mp4",
    type: "provider",
    name: "Dog Walker SP",
    tradeName: "Dog Walker SP",
    avatar: MP_IMAGES.food,
    cover: MP_IMAGES.food,
    description: "Passeios e pet sitting na Zona Sul.",
    location: "Zona Sul, SP",
    distanceKm: 4.2,
    rating: 4.92,
    reviewCount: 234,
    salesCount: 890,
    responseTime: "~20 min",
    isVerified: false,
    categories: ["Dog walker", "Pet sitter"],
    hours: "7h-21h",
    policies: { cancellation: "24h de antecedência." },
    portfolio: [{ id: "pf4", type: "image", url: MP_IMAGES.food, caption: "Passeio no parque" }],
  },
  {
    id: "mp5",
    type: "store",
    name: "ECOPET Store",
    tradeName: "ECOPET Store",
    avatar: MP_IMAGES.product,
    cover: MP_IMAGES.product,
    description: "Loja oficial ECOPET. Frete grátis e assinaturas.",
    location: "Brasil",
    distanceKm: 0,
    rating: 4.85,
    reviewCount: 1200,
    salesCount: 15000,
    responseTime: "Instantâneo",
    isVerified: true,
    categories: ["Rações", "Assinaturas", "Saúde"],
    hours: "24/7 online",
    policies: {
      delivery: "Entrega nacional 3-7 dias.",
      exchange: "30 dias para troca.",
      refund: "7 dias arrependimento.",
    },
    portfolio: [],
  },
  {
    id: "mp6",
    type: "seller",
    name: "PetStyle Loja",
    tradeName: "PetStyle",
    avatar: MP_IMAGES.toy,
    cover: MP_IMAGES.toy,
    description: "Acessórios e roupas fashion para pets.",
    location: "Campinas, SP",
    distanceKm: 8.0,
    rating: 4.6,
    reviewCount: 189,
    salesCount: 560,
    responseTime: "~1h",
    isVerified: true,
    categories: ["Roupas", "Acessórios", "Coleiras"],
    hours: "Seg-Sex 9h-18h",
    policies: { delivery: "Envio em 2 dias úteis." },
    portfolio: [],
  },
];

const partner = (id: string) => MOCK_PARTNERS.find((p) => p.id === id)!;

export const MOCK_PRODUCTS: MarketplaceProduct[] = [
  {
    id: "prod1", name: "Ração Premium Golden 15kg", slug: "racao-golden-15kg",
    description: "Ração super premium para cães adultos de porte médio/grande.",
    longDescription: "Formulada com proteína de alta qualidade, ômega 3 e 6, prebióticos e antioxidantes naturais.",
    category: "racoes", subcategory: "seca", brand: "Golden",
    price: 189.9, comparePrice: 219.9, images: [MP_IMAGES.food, MP_IMAGES.product],
    rating: 4.8, reviewCount: 234, partnerId: "mp5",
    partner: { id: "mp5", name: "ECOPET Store", avatar: MP_IMAGES.product, isVerified: true, location: "Brasil" },
    inStock: true, deliveryDays: 3, freeShipping: true, isPromo: true, subscriptionAvailable: true,
    species: ["Cão"], sizes: ["Médio", "Grande"], aiTag: "best_for_pet",
    specs: { "Peso": "15kg", "Idade": "Adulto", "Sabor": "Frango" },
    faq: [{ q: "Serve para filhote?", a: "Indicada para cães a partir de 12 meses." }],
  },
  {
    id: "prod2", name: "Shampoo Hipoalergênico 500ml", slug: "shampoo-hipo",
    description: "Ideal para peles sensíveis. Sem parabenos.",
    category: "higiene", brand: "PetClean",
    price: 45.9, comparePrice: 52.9, images: [MP_IMAGES.product],
    rating: 4.7, reviewCount: 89, partnerId: "mp1",
    partner: { id: "mp1", name: "Pet Shop Amigo", avatar: MP_IMAGES.shop, isVerified: true, location: "Vila Mariana" },
    inStock: true, deliveryDays: 1, freeShipping: false, isPromo: true, aiTag: "safest",
    species: ["Cão", "Gato"],
  },
  {
    id: "prod3", name: "Brinquedo Kong Classic M", slug: "kong-classic",
    description: "Resistente e estimulante. Recheie com petisco.",
    category: "brinquedos", brand: "Kong",
    price: 79.9, images: [MP_IMAGES.toy],
    rating: 4.9, reviewCount: 456, partnerId: "mp6",
    partner: { id: "mp6", name: "PetStyle Loja", avatar: MP_IMAGES.toy, isVerified: true, location: "Campinas" },
    inStock: true, deliveryDays: 2, freeShipping: true, isPromo: false, aiTag: "best_value",
  },
  {
    id: "prod4", name: "Cama Ortopédica Memory Foam G", slug: "cama-ortopedica",
    description: "Conforto para pets idosos ou com articulações sensíveis.",
    category: "camas", brand: "PetDream",
    price: 249.9, comparePrice: 299.9, images: [MP_IMAGES.bed],
    rating: 4.85, reviewCount: 167, partnerId: "mp5",
    partner: { id: "mp5", name: "ECOPET Store", avatar: MP_IMAGES.product, isVerified: true, location: "Brasil" },
    inStock: true, deliveryDays: 5, freeShipping: true, isPromo: true,
    sizes: ["Grande", "Gigante"],
  },
  {
    id: "prod5", name: "Petisco Natural Desidratado 200g", slug: "petisco-natural",
    description: "100% natural, sem conservantes artificiais.",
    category: "petiscos", brand: "NaturaPet",
    price: 32.9, images: [MP_IMAGES.food],
    rating: 4.6, reviewCount: 78, partnerId: "mp1",
    partner: { id: "mp1", name: "Pet Shop Amigo", avatar: MP_IMAGES.shop, isVerified: true, location: "Vila Mariana" },
    inStock: true, deliveryDays: 1, freeShipping: false, isPromo: false,
  },
  {
    id: "prod6", name: "Coleira GPS Smart Pet", slug: "coleira-gps",
    description: "Rastreamento em tempo real via app ECOPET.",
    category: "coleiras", brand: "TrackPet",
    price: 399.9, comparePrice: 449.9, images: [MP_IMAGES.product],
    rating: 4.4, reviewCount: 45, partnerId: "mp6",
    partner: { id: "mp6", name: "PetStyle Loja", avatar: MP_IMAGES.toy, isVerified: true, location: "Campinas" },
    inStock: true, deliveryDays: 4, freeShipping: true, isPromo: true, isSponsored: true,
  },
  {
    id: "prod7", name: "Kit Vacinas Anual Cão", slug: "kit-vacinas",
    description: "V10, antirrabica e vermífugo inclusos.",
    category: "saude",
    price: 129.0, images: [MP_IMAGES.vet],
    rating: 4.95, reviewCount: 312, partnerId: "mp2",
    partner: { id: "mp2", name: "VetCare Premium", avatar: MP_IMAGES.vet, isVerified: true, location: "Pinheiros" },
    inStock: true, deliveryDays: 0, freeShipping: false, isPromo: false, aiTag: "ai_pick",
  },
  {
    id: "prod8", name: "Caixa Transporte Aérea M", slug: "caixa-transporte",
    description: "Homologada IATA. Ventilação 360°.",
    category: "transporte", brand: "TravelPet",
    price: 159.9, images: [MP_IMAGES.transport],
    rating: 4.5, reviewCount: 67, partnerId: "mp5",
    partner: { id: "mp5", name: "ECOPET Store", avatar: MP_IMAGES.product, isVerified: true, location: "Brasil" },
    inStock: false, deliveryDays: 7, freeShipping: true, isPromo: false,
  },
];

export const MOCK_SERVICES: MarketplaceService[] = [
  {
    id: "srv1", name: "Banho & Tosa Completa", slug: "banho-tosa",
    description: "Banho, tosa higiênica, unhas e ouvidos.",
    category: "banho-tosa", price: 89, durationMin: 90, image: MP_IMAGES.grooming,
    rating: 4.9, reviewCount: 456, partnerId: "mp1",
    partner: { id: "mp1", name: "Pet Shop Amigo", avatar: MP_IMAGES.shop, isVerified: true, location: "Vila Mariana", distanceKm: 1.2 },
    homeService: false, inPerson: true, telehealth: false, aiTag: "ideal_today",
    availableDates: ["2026-05-25", "2026-05-26", "2026-05-27"],
  },
  {
    id: "srv2", name: "Consulta Veterinária", slug: "consulta-vet",
    description: "Consulta clínica geral presencial ou online.",
    category: "consulta-vet", price: 150, durationMin: 30, image: MP_IMAGES.vet,
    rating: 4.95, reviewCount: 890, partnerId: "mp3",
    partner: { id: "mp3", name: "Dr. Carlos Mendes", avatar: MP_IMAGES.vet, isVerified: true, location: "SP", distanceKm: 2.1 },
    homeService: false, inPerson: true, telehealth: true, aiTag: "recommended",
    availableDates: ["2026-05-25", "2026-05-28"],
  },
  {
    id: "srv3", name: "Vacinação V10 + Antirrabica", slug: "vacinacao",
    description: "Protocolo completo com carteira digital ECOPET.",
    category: "vacinacao", price: 120, durationMin: 20, image: MP_IMAGES.vet,
    rating: 4.9, reviewCount: 567, partnerId: "mp2",
    partner: { id: "mp2", name: "VetCare Premium", avatar: MP_IMAGES.vet, isVerified: true, location: "Pinheiros", distanceKm: 3.5 },
    homeService: true, inPerson: true, telehealth: false,
  },
  {
    id: "srv4", name: "Dog Walker — Passeio 1h", slug: "dog-walker",
    description: "Passeio individual ou em grupo pequeno.",
    category: "dog-walker", price: 55, durationMin: 60, image: MP_IMAGES.food,
    rating: 4.92, reviewCount: 234, partnerId: "mp4",
    partner: { id: "mp4", name: "Dog Walker SP", avatar: MP_IMAGES.food, isVerified: false, location: "Zona Sul", distanceKm: 4.2 },
    homeService: true, inPerson: true, telehealth: false, aiTag: "ideal_today",
  },
  {
    id: "srv5", name: "Hospedagem Pet — Diária", slug: "hospedagem",
    description: "Ambiente climatizado com monitoramento 24h.",
    category: "hospedagem", price: 95, durationMin: 1440, image: MP_IMAGES.bed,
    rating: 4.7, reviewCount: 123, partnerId: "mp1",
    partner: { id: "mp1", name: "Pet Shop Amigo", avatar: MP_IMAGES.shop, isVerified: true, location: "Vila Mariana", distanceKm: 1.2 },
    homeService: false, inPerson: true, telehealth: false,
  },
  {
    id: "srv6", name: "Emergência Veterinária 24h", slug: "emergencia",
    description: "Atendimento imediato para casos urgentes.",
    category: "emergencia", price: 280, durationMin: 60, image: MP_IMAGES.vet,
    rating: 4.85, reviewCount: 345, partnerId: "mp2",
    partner: { id: "mp2", name: "VetCare Premium", avatar: MP_IMAGES.vet, isVerified: true, location: "Pinheiros", distanceKm: 3.5 },
    homeService: false, inPerson: true, telehealth: false, emergency: true,
  },
  {
    id: "srv7", name: "Adestramento — Sessão", slug: "adestramento",
    description: "Obediência básica e correção comportamental.",
    category: "adestramento", price: 120, durationMin: 60, image: MP_IMAGES.food,
    rating: 4.8, reviewCount: 89, partnerId: "mp4",
    partner: { id: "mp4", name: "Dog Walker SP", avatar: MP_IMAGES.food, isVerified: false, location: "Zona Sul", distanceKm: 4.2 },
    homeService: true, inPerson: true, telehealth: false,
  },
  {
    id: "srv8", name: "Teleorientação Veterinária", slug: "teleorientacao",
    description: "Orientação rápida por vídeo com veterinário.",
    category: "teleorientacao", price: 79, durationMin: 20, image: MP_IMAGES.vet,
    rating: 4.88, reviewCount: 210, partnerId: "mp3",
    partner: { id: "mp3", name: "Dr. Carlos Mendes", avatar: MP_IMAGES.vet, isVerified: true, location: "SP", distanceKm: 2.1 },
    homeService: false, inPerson: false, telehealth: true, aiTag: "best_value",
  },
];

export const MOCK_REVIEWS: MarketplaceReview[] = [
  { id: "rv1", targetId: "prod1", targetType: "product", author: "Maria S.", avatar: MP_IMAGES.food, rating: 5, comment: "Minha Golden adora! Pelagem brilhante.", createdAt: "2026-05-20T10:00:00.000Z" },
  { id: "rv2", targetId: "prod1", targetType: "product", author: "João P.", avatar: MP_IMAGES.vet, rating: 4, comment: "Boa qualidade, entrega rápida.", partnerReply: "Obrigado João! 🐾", createdAt: "2026-05-18T14:00:00.000Z" },
  { id: "rv3", targetId: "mp1", targetType: "partner", author: "Ana L.", avatar: MP_IMAGES.shop, rating: 5, comment: "Melhor pet shop da região!", createdAt: "2026-05-15T09:00:00.000Z" },
  { id: "rv4", targetId: "srv1", targetType: "service", author: "Carlos M.", avatar: MP_IMAGES.grooming, rating: 5, comment: "Tosa perfeita, Luna ficou linda!", createdAt: "2026-05-22T16:00:00.000Z" },
];

export const MOCK_AI_RECOMMENDATIONS: AiRecommendation[] = [
  { id: "ai1", tag: "best_for_pet", title: "Ração Premium Golden 15kg", subtitle: "Ideal para Luna — Golden Retriever adulta", itemType: "product", itemId: "prod1", image: MP_IMAGES.food, href: "/marketplace/produto/prod1" },
  { id: "ai2", tag: "ideal_today", title: "Dog Walker — Passeio 1h", subtitle: "Disponível hoje na Zona Sul", itemType: "service", itemId: "srv4", image: MP_IMAGES.food, href: "/marketplace/servico/srv4" },
  { id: "ai3", tag: "best_value", title: "Teleorientação Veterinária", subtitle: "Melhor custo-benefício para triagem", itemType: "service", itemId: "srv8", image: MP_IMAGES.vet, href: "/marketplace/servico/srv8" },
  { id: "ai4", tag: "partner_pick", title: "Pet Shop Amigo", subtitle: "1,2 km · 4.8★ · Verificado", itemType: "partner", itemId: "mp1", image: MP_IMAGES.shop, href: "/marketplace/parceiro/mp1" },
  { id: "ai5", tag: "combo", title: "Combo Banho + Ração", subtitle: "Economize 15% no pacote mensal", itemType: "product", itemId: "prod1", image: MP_IMAGES.grooming, href: "/marketplace/produtos" },
  { id: "ai6", tag: "safest", title: "Shampoo Hipoalergênico", subtitle: "Recomendado para pele sensível", itemType: "product", itemId: "prod2", image: MP_IMAGES.product, href: "/marketplace/produto/prod2" },
];

export const MOCK_SUBSCRIPTIONS: SubscriptionPlan[] = [
  { id: "sub1", name: "Ração Mensal Luna", description: "Entrega automática todo mês", frequency: "Mensal", price: 179.9, items: ["Ração Golden 15kg", "Frete grátis"], image: MP_IMAGES.food, partnerId: "mp5" },
  { id: "sub2", name: "Banho Mensal", description: "1 banho & tosa por mês", frequency: "Mensal", price: 79.9, items: ["Banho completo", "10% desconto produtos"], image: MP_IMAGES.grooming, partnerId: "mp1" },
  { id: "sub3", name: "Plano Saúde Pet", description: "Consultas + vacinas + teleorientação", frequency: "Anual", price: 89.9, items: ["2 consultas/ano", "Vacinas", "Tele 24h"], image: MP_IMAGES.vet, partnerId: "mp2" },
];

export function getProductById(id: string) {
  return MOCK_PRODUCTS.find((p) => p.id === id);
}

export function getServiceById(id: string) {
  return MOCK_SERVICES.find((s) => s.id === id);
}

export function getPartnerById(id: string) {
  return MOCK_PARTNERS.find((p) => p.id === id);
}

export function getProductsByPartner(partnerId: string) {
  return MOCK_PRODUCTS.filter((p) => p.partnerId === partnerId);
}

export function getServicesByPartner(partnerId: string) {
  return MOCK_SERVICES.filter((s) => s.partnerId === partnerId);
}

export function getReviewsForTarget(targetId: string) {
  return MOCK_REVIEWS.filter((r) => r.targetId === targetId);
}

export function getRelatedProducts(productId: string, limit = 4) {
  const p = getProductById(productId);
  if (!p) return [];
  return MOCK_PRODUCTS.filter((x) => x.id !== productId && x.category === p.category).slice(0, limit);
}

export function getRelatedServices(serviceId: string, limit = 4) {
  const s = getServiceById(serviceId);
  if (!s) return [];
  return MOCK_SERVICES.filter((x) => x.id !== serviceId && x.category === s.category).slice(0, limit);
}
