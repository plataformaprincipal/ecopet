import type {
  SocialProfile,
  SocialPost,
  SocialComment,
  SocialStory,
  SocialReel,
  TrendTag,
  AiSuggestion,
  AiCommunityInsight,
  Conversation,
  ChatMessage,
  ExploreSection,
} from "./types";
import { UNSPLASH } from "./config";

export const MOCK_PROFILES: SocialProfile[] = [
  {
    id: "p1",
    type: "tutor",
    name: "Maria Silva",
    username: "maria_pets",
    avatar: UNSPLASH.dog1,
    cover: UNSPLASH.park,
    bio: "Mãe da Luna & Thor 🐾 | Saúde pet | ECOPET Premium",
    location: "São Paulo, SP",
    isVerified: true,
    followers: 2840,
    following: 412,
    badges: ["early-adopter", "premium"],
    pets: [
      { id: "pet1", name: "Luna", avatar: UNSPLASH.golden, species: "Golden Retriever" },
      { id: "pet2", name: "Thor", avatar: UNSPLASH.dog2, species: "SRD" },
    ],
  },
  {
    id: "p2",
    type: "pet",
    name: "Luna",
    username: "luna_golden",
    avatar: UNSPLASH.golden,
    cover: UNSPLASH.park,
    bio: "Golden Retriever | 3 anos | Amo bolinha e passeios 🎾",
    location: "São Paulo, SP",
    isVerified: false,
    followers: 1520,
    following: 89,
    badges: ["pet-star"],
  },
  {
    id: "p3",
    type: "veterinarian",
    name: "Dr. Carlos Mendes",
    username: "dr_carlos_vet",
    avatar: UNSPLASH.vet,
    cover: UNSPLASH.vet,
    bio: "CRMV SP-12345 | Clínica Geral & Dermatologia | Teleconsultas",
    location: "São Paulo, SP",
    isVerified: true,
    followers: 8900,
    following: 210,
    rating: 4.9,
    badges: ["verified-vet"],
    services: [
      { id: "s1", name: "Consulta online", price: 120 },
      { id: "s2", name: "Retorno", price: 80 },
    ],
  },
  {
    id: "p4",
    type: "clinic",
    name: "VetCare Premium",
    username: "vetcare_sp",
    avatar: UNSPLASH.vet,
    cover: UNSPLASH.shop,
    bio: "Clínica 24h | Emergência | Cirurgias | Exames",
    location: "Pinheiros, SP",
    isVerified: true,
    followers: 12400,
    following: 45,
    rating: 4.8,
    badges: ["clinic-partner"],
    services: [
      { id: "s3", name: "Consulta presencial", price: 150 },
      { id: "s4", name: "Emergência", price: 280 },
    ],
  },
  {
    id: "p5",
    type: "petshop",
    name: "Pet Shop Amigo",
    username: "petshop_amigo",
    avatar: UNSPLASH.shop,
    cover: UNSPLASH.shop,
    bio: "Produtos premium | Banho & Tosa | Entrega rápida",
    location: "Vila Mariana, SP",
    isVerified: true,
    followers: 5600,
    following: 120,
    rating: 4.7,
    badges: ["partner-store"],
    products: [
      { id: "prod1", name: "Ração Premium 15kg", price: 189.9, image: UNSPLASH.product },
      { id: "prod2", name: "Shampoo hipoalergênico", price: 45.9, image: UNSPLASH.product },
    ],
    services: [{ id: "s5", name: "Banho & Tosa", price: 89 }],
  },
  {
    id: "p6",
    type: "ong",
    name: "ONG Patinhas Felizes",
    username: "patinhas_felizes",
    avatar: UNSPLASH.adoption,
    cover: UNSPLASH.adoption,
    bio: "Adoção responsável | Resgate | Lar temporário",
    location: "São Paulo, SP",
    isVerified: true,
    followers: 18900,
    following: 340,
    badges: ["ong-verified"],
  },
  {
    id: "p7",
    type: "provider",
    name: "Dog Walker SP",
    username: "dogwalker_sp",
    avatar: UNSPLASH.park,
    bio: "Passeios diários | Pet sitter | Zona Sul",
    location: "Zona Sul, SP",
    isVerified: false,
    followers: 890,
    following: 156,
    rating: 4.95,
    badges: ["top-provider"],
    services: [{ id: "s6", name: "Passeio 1h", price: 55 }],
  },
  {
    id: "p8",
    type: "store",
    name: "ECOPET Store",
    username: "ecopet_store",
    avatar: UNSPLASH.product,
    cover: UNSPLASH.product,
    bio: "Loja oficial ECOPET | Frete grátis acima de R$99",
    location: "Brasil",
    isVerified: true,
    followers: 45000,
    following: 12,
    badges: ["official"],
    products: [
      { id: "prod3", name: "Kit vacinas pet", price: 129, image: UNSPLASH.product },
    ],
  },
];

const profile = (id: string) => MOCK_PROFILES.find((p) => p.id === id)!;

export const MOCK_POSTS: SocialPost[] = [
  {
    id: "post1",
    type: "photo",
    author: profile("p1"),
    pet: profile("p1").pets![0],
    location: "Parque Ibirapuera",
    createdAt: "2026-05-24T11:00:00.000Z",
    caption: "Domingo perfeito com a Luna! ☀️🐕 Quem mais levou o pet pro parque hoje?",
    hashtags: ["ecopet", "goldenretriever", "domingopet"],
    media: [{ url: UNSPLASH.golden, type: "image" }],
    likes: 342,
    commentsCount: 28,
    shares: 12,
    saves: 45,
  },
  {
    id: "post2",
    type: "carousel",
    author: profile("p5"),
    location: "Pet Shop Amigo",
    createdAt: "2026-05-24T09:30:00.000Z",
    caption: "Novidades na loja! Arrasta pra ver os lançamentos de verão 🌞",
    hashtags: ["petshop", "promo", "ecopet"],
    media: [
      { url: UNSPLASH.product, type: "image" },
      { url: UNSPLASH.grooming, type: "image" },
      { url: UNSPLASH.shop, type: "image" },
    ],
    likes: 128,
    commentsCount: 14,
    shares: 8,
    saves: 32,
    isSponsored: true,
  },
  {
    id: "post3",
    type: "ai_tip",
    author: profile("p3"),
    createdAt: "2026-05-24T08:00:00.000Z",
    caption: "💡 Dica IA ECOPET: Nos dias quentes, ofereça água fresca a cada 2h e evite passeios entre 11h-16h.",
    hashtags: ["saudepet", "iaecopet", "verao"],
    media: [{ url: UNSPLASH.vet, type: "image" }],
    likes: 890,
    commentsCount: 56,
    shares: 234,
    saves: 412,
    aiInsight: "Recomendado com base no clima de SP e perfil Golden Retriever",
  },
  {
    id: "post4",
    type: "marketplace",
    author: profile("p8"),
    createdAt: "2026-05-23T16:00:00.000Z",
    caption: "Kit vacinas com 20% OFF só esta semana! Proteja seu pet 🛡️",
    hashtags: ["marketplace", "vacinas", "ecopet"],
    media: [{ url: UNSPLASH.product, type: "image" }],
    likes: 256,
    commentsCount: 19,
    shares: 45,
    saves: 89,
    marketplace: {
      productId: "prod3",
      name: "Kit vacinas pet",
      price: 129,
      image: UNSPLASH.product,
      cta: "comprar",
    },
  },
  {
    id: "post5",
    type: "service",
    author: profile("p7"),
    location: "Zona Sul, SP",
    createdAt: "2026-05-23T14:00:00.000Z",
    caption: "Vagas abertas para passeios matinais! Seu pet merece exercício diário 🦮",
    hashtags: ["dogwalker", "servicos", "ecopet"],
    media: [{ url: UNSPLASH.park, type: "image" }],
    likes: 67,
    commentsCount: 8,
    shares: 5,
    saves: 21,
    service: { id: "s6", name: "Passeio 1h", price: 55, cta: "contratar" },
  },
  {
    id: "post6",
    type: "adoption",
    author: profile("p6"),
    createdAt: "2026-05-23T10:00:00.000Z",
    caption: "Mel precisa de um lar! Cachorra docile, 2 anos, castrada. Adoção responsável ❤️",
    hashtags: ["adocao", "adoteumamigo", "ecopet"],
    media: [{ url: UNSPLASH.adoption, type: "image" }],
    likes: 1240,
    commentsCount: 89,
    shares: 456,
    saves: 312,
    adoption: { petName: "Mel", species: "SRD", image: UNSPLASH.adoption },
  },
  {
    id: "post7",
    type: "poll",
    author: profile("p1"),
    pet: profile("p1").pets![1],
    createdAt: "2026-05-22T18:00:00.000Z",
    caption: "Enquete da comunidade: qual brinquedo o Thor prefere?",
    hashtags: ["enquete", "comunidade"],
    media: [{ url: UNSPLASH.dog2, type: "image" }],
    likes: 98,
    commentsCount: 34,
    shares: 3,
    saves: 8,
    poll: {
      question: "Brinquedo favorito do Thor?",
      options: [
        { id: "o1", label: "Bolinha 🎾", votes: 124 },
        { id: "o2", label: "Corda 🪢", votes: 89 },
        { id: "o3", label: "Pelúcia 🧸", votes: 45 },
      ],
    },
  },
  {
    id: "post8",
    type: "reel",
    author: profile("p2"),
    location: "São Paulo, SP",
    createdAt: "2026-05-22T12:00:00.000Z",
    caption: "Luna aprendendo novo truque! 🐾✨ #reels #golden",
    hashtags: ["reels", "goldenretriever", "ecopet"],
    media: [{ url: UNSPLASH.golden, type: "video" }],
    likes: 2100,
    commentsCount: 156,
    shares: 89,
    saves: 445,
    aiInsight: "Tendência entre Golden Retrievers na sua região",
  },
  {
    id: "post9",
    type: "sponsored",
    author: profile("p4"),
    createdAt: "2026-05-21T09:00:00.000Z",
    caption: "Check-up anual com 30% OFF na VetCare Premium. Agende agora!",
    hashtags: ["saude", "clinica", "patrocinado"],
    media: [{ url: UNSPLASH.vet, type: "image" }],
    likes: 445,
    commentsCount: 32,
    shares: 67,
    saves: 98,
    isSponsored: true,
    service: { id: "s3", name: "Check-up completo", price: 199, cta: "agendar" },
  },
  {
    id: "post10",
    type: "photo",
    author: profile("p3"),
    createdAt: "2026-05-20T15:00:00.000Z",
    caption: "Dermatite alérgica é comum nesta época. Fique atento à coceira excessiva!",
    hashtags: ["veterinario", "dermatologia", "saudepet"],
    media: [{ url: UNSPLASH.cat1, type: "image" }],
    likes: 678,
    commentsCount: 45,
    shares: 123,
    saves: 267,
  },
];

export const MOCK_COMMENTS: SocialComment[] = [
  {
    id: "c1",
    postId: "post1",
    author: { id: "p7", name: "Dog Walker SP", username: "dogwalker_sp", avatar: UNSPLASH.park, isVerified: false },
    content: "Linda demais! 🐕 Parque Ibirapuera é incrível para Goldens",
    createdAt: "2026-05-24T11:30:00.000Z",
    likes: 12,
    replies: [
      {
        id: "c1r1",
        postId: "post1",
        author: { id: "p1", name: "Maria Silva", username: "maria_pets", avatar: UNSPLASH.dog1, isVerified: true },
        content: "Concordo! Ela adora correr lá 💚",
        createdAt: "2026-05-24T11:45:00.000Z",
        likes: 5,
      },
    ],
  },
  {
    id: "c2",
    postId: "post1",
    author: { id: "p3", name: "Dr. Carlos Mendes", username: "dr_carlos_vet", avatar: UNSPLASH.vet, isVerified: true },
    content: "Lembre-se do protetor solar nas orelhas em dias muito quentes!",
    createdAt: "2026-05-24T12:00:00.000Z",
    likes: 34,
    aiSuggested: true,
  },
  {
    id: "c3",
    postId: "post3",
    author: { id: "p1", name: "Maria Silva", username: "maria_pets", avatar: UNSPLASH.dog1, isVerified: true },
    content: "Dica essencial! A Luna agradece 🙏",
    createdAt: "2026-05-24T08:30:00.000Z",
    likes: 8,
  },
  {
    id: "c4",
    postId: "post6",
    author: { id: "p2", name: "Luna", username: "luna_golden", avatar: UNSPLASH.golden, isVerified: false },
    content: "Mel é uma fofa! 🥺❤️",
    createdAt: "2026-05-23T11:00:00.000Z",
    likes: 56,
  },
];

export const MOCK_STORIES: SocialStory[] = [
  { id: "st1", profile: { id: "p1", name: "Maria", avatar: UNSPLASH.dog1, type: "tutor", isVerified: true }, preview: UNSPLASH.golden, media: { url: UNSPLASH.golden, type: "image" }, createdAt: "2026-05-24T10:00:00.000Z", viewed: false },
  { id: "st2", profile: { id: "p2", name: "Luna", avatar: UNSPLASH.golden, type: "pet", isVerified: false }, preview: UNSPLASH.park, media: { url: UNSPLASH.park, type: "image" }, createdAt: "2026-05-24T09:00:00.000Z", viewed: false, label: "Passeio" },
  { id: "st3", profile: { id: "p6", name: "ONG Patinhas", avatar: UNSPLASH.adoption, type: "ong", isVerified: true }, preview: UNSPLASH.adoption, media: { url: UNSPLASH.adoption, type: "image" }, createdAt: "2026-05-24T08:00:00.000Z", viewed: false, isAdoption: true, label: "Adoção" },
  { id: "st4", profile: { id: "p5", name: "Pet Shop", avatar: UNSPLASH.shop, type: "petshop", isVerified: true }, preview: UNSPLASH.product, media: { url: UNSPLASH.product, type: "image" }, createdAt: "2026-05-23T20:00:00.000Z", viewed: true, isSponsored: true, label: "Promo" },
  { id: "st5", profile: { id: "p3", name: "Dr. Carlos", avatar: UNSPLASH.vet, type: "veterinarian", isVerified: true }, preview: UNSPLASH.vet, media: { url: UNSPLASH.vet, type: "image" }, createdAt: "2026-05-23T18:00:00.000Z", viewed: true, label: "Dica vet" },
  { id: "st6", profile: { id: "p8", name: "ECOPET", avatar: UNSPLASH.product, type: "store", isVerified: true }, preview: UNSPLASH.product, media: { url: UNSPLASH.product, type: "image" }, createdAt: "2026-05-23T12:00:00.000Z", viewed: true, isSponsored: true },
];

export const MOCK_REELS: SocialReel[] = [
  { id: "r1", author: { id: "p2", name: "Luna", username: "luna_golden", avatar: UNSPLASH.golden, isVerified: false, type: "pet" }, pet: { id: "pet1", name: "Luna", avatar: UNSPLASH.golden }, videoUrl: UNSPLASH.golden, thumbnail: UNSPLASH.golden, caption: "Truque novo da Luna! 🎾", hashtags: ["golden", "reels"], likes: 4200, commentsCount: 234, shares: 89, aiRecommended: true, aiReason: "Baseado no perfil Golden Retriever" },
  { id: "r2", author: { id: "p7", name: "Dog Walker SP", username: "dogwalker_sp", avatar: UNSPLASH.park, isVerified: false, type: "provider" }, videoUrl: UNSPLASH.park, thumbnail: UNSPLASH.park, caption: "Passeio matinal na Zona Sul 🌅", hashtags: ["dogwalker", "passeio"], likes: 890, commentsCount: 45, shares: 23 },
  { id: "r3", author: { id: "p5", name: "Pet Shop Amigo", username: "petshop_amigo", avatar: UNSPLASH.shop, isVerified: true, type: "petshop" }, videoUrl: UNSPLASH.grooming, thumbnail: UNSPLASH.grooming, caption: "Transformação banho & tosa ✂️", hashtags: ["banhoetosa", "antesedepois"], likes: 1560, commentsCount: 78, shares: 34, aiRecommended: true, aiReason: "Serviço popular na sua região" },
  { id: "r4", author: { id: "p6", name: "ONG Patinhas", username: "patinhas_felizes", avatar: UNSPLASH.adoption, isVerified: true, type: "ong" }, videoUrl: UNSPLASH.adoption, thumbnail: UNSPLASH.adoption, caption: "Mel procura um lar ❤️ Adote!", hashtags: ["adocao", "ecopet"], likes: 8900, commentsCount: 456, shares: 1200 },
  { id: "r5", author: { id: "p1", name: "Maria Silva", username: "maria_pets", avatar: UNSPLASH.dog1, isVerified: true, type: "tutor" }, pet: { id: "pet2", name: "Thor", avatar: UNSPLASH.dog2 }, videoUrl: UNSPLASH.dog2, thumbnail: UNSPLASH.dog2, caption: "Thor vs bolinha 😂", hashtags: ["humor", "pets"], likes: 2340, commentsCount: 167, shares: 56 },
];

export const MOCK_TRENDS: TrendTag[] = [
  { tag: "#ecopet", posts: 12400, growth: "+24%", category: "Geral" },
  { tag: "#goldenretriever", posts: 8900, growth: "+18%", category: "Raças" },
  { tag: "#adoteumamigo", posts: 5600, growth: "+32%", category: "Adoção" },
  { tag: "#saudepet", posts: 7800, growth: "+15%", category: "Saúde" },
  { tag: "#banhoetosa", posts: 3400, growth: "+21%", category: "Serviços" },
  { tag: "#iaecopet", posts: 2100, growth: "+45%", category: "IA" },
  { tag: "#dogwalker", posts: 1890, growth: "+12%", category: "Serviços" },
  { tag: "#marketplacepet", posts: 4500, growth: "+19%", category: "Marketplace" },
];

export const MOCK_AI_SUGGESTIONS: AiSuggestion[] = [
  { id: "ai1", type: "pet", title: "Bella — Golden Retriever", subtitle: "Perfil similar à Luna na sua região", image: UNSPLASH.golden, href: "/social/perfil/p2" },
  { id: "ai2", type: "product", title: "Ração Premium 15kg", subtitle: "Recomendado para Golden Retriever adulto", image: UNSPLASH.product, href: "/marketplace" },
  { id: "ai3", type: "vet", title: "Dr. Carlos Mendes", subtitle: "Dermatologia — 4.9★ · Teleconsulta", image: UNSPLASH.vet, href: "/social/perfil/p3" },
  { id: "ai4", type: "adoption", title: "Mel — SRD, 2 anos", subtitle: "Match 92% com seu perfil de tutor", image: UNSPLASH.adoption, href: "/adocao" },
  { id: "ai5", type: "service", title: "Banho & Tosa", subtitle: "Pet Shop Amigo — 1,2 km de você", image: UNSPLASH.grooming, href: "/marketplace" },
  { id: "ai6", type: "content", title: "Dicas de verão para pets", subtitle: "Tendência entre tutores de SP", image: UNSPLASH.vet, href: "/social/post/post3" },
];

export const MOCK_AI_COMMUNITY: AiCommunityInsight[] = [
  { id: "ci1", icon: "pet", text: "Seu pet pode gostar desse conteúso sobre passeios matinais" },
  { id: "ci2", icon: "trend", text: "Tendência entre Golden Retrievers: truques de obediência" },
  { id: "ci3", icon: "vet", text: "Veterinários recomendam hidratação extra nesta semana em SP" },
  { id: "ci4", icon: "product", text: "Produtos anti-pulgas com 15% OFF — baseado no histórico da Luna" },
  { id: "ci5", icon: "local", text: "3 tutores próximos publicaram no Parque Ibirapuera hoje" },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  { id: "conv1", participant: { id: "p3", name: "Dr. Carlos Mendes", avatar: UNSPLASH.vet, isVerified: true, type: "veterinarian" }, lastMessage: "Consulta confirmada para terça às 15h", lastMessageAt: "2026-05-24T10:30:00.000Z", unread: 2, online: true },
  { id: "conv2", participant: { id: "p7", name: "Dog Walker SP", avatar: UNSPLASH.park, isVerified: false, type: "provider" }, lastMessage: "Posso buscar a Luna amanhã às 8h?", lastMessageAt: "2026-05-24T09:00:00.000Z", unread: 0, online: true },
  { id: "conv3", participant: { id: "p5", name: "Pet Shop Amigo", avatar: UNSPLASH.shop, isVerified: true, type: "petshop" }, lastMessage: "Seu pedido #4821 foi enviado! 📦", lastMessageAt: "2026-05-23T18:00:00.000Z", unread: 1 },
  { id: "conv4", participant: { id: "p6", name: "ONG Patinhas", avatar: UNSPLASH.adoption, isVerified: true, type: "ong" }, lastMessage: "Obrigada pelo interesse na Mel! ❤️", lastMessageAt: "2026-05-22T14:00:00.000Z", unread: 0 },
];

export const MOCK_MESSAGES: ChatMessage[] = [
  { id: "m1", conversationId: "conv1", senderId: "p3", content: "Olá Maria! Recebi a foto da Luna. Parece dermatite leve.", createdAt: "2026-05-24T10:00:00.000Z", isMine: false, type: "text" },
  { id: "m2", conversationId: "conv1", senderId: "me", content: "Obrigada Dr.! Ela tem coçado bastante nas orelhas.", createdAt: "2026-05-24T10:05:00.000Z", isMine: true, type: "text" },
  { id: "m3", conversationId: "conv1", senderId: "p3", content: "Consulta confirmada para terça às 15h", createdAt: "2026-05-24T10:30:00.000Z", isMine: false, type: "text" },
  { id: "m4", conversationId: "conv1", senderId: "ai", content: "💡 Sugestão IA: \"Confirmado! Levo o histórico de vacinas.\"", createdAt: "2026-05-24T10:31:00.000Z", isMine: false, type: "ai" },
];

export const MOCK_EXPLORE_SECTIONS: ExploreSection[] = [
  {
    id: "trending",
    title: "Em alta agora",
    type: "grid",
    items: MOCK_POSTS.slice(0, 6).map((p) => ({
      id: p.id,
      title: p.author.name,
      subtitle: formatCount(p.likes) + " curtidas",
      image: p.media[0]?.url,
      href: `/social/post/${p.id}`,
    })),
  },
  {
    id: "hashtags",
    title: "Hashtags populares",
    type: "hashtags",
    items: MOCK_TRENDS.map((t) => ({
      id: t.tag,
      title: t.tag,
      subtitle: `${formatCount(t.posts)} posts · ${t.growth}`,
      href: `/social/tendencias`,
    })),
  },
  {
    id: "pets",
    title: "Pets populares",
    type: "list",
    items: [
      { id: "p2", title: "Luna", subtitle: "Golden Retriever · 1.5K seguidores", image: UNSPLASH.golden, href: "/social/perfil/p2", badge: "⭐" },
      { id: "pet-x", title: "Thor", subtitle: "SRD · 890 seguidores", image: UNSPLASH.dog2, href: "/social/perfil/p1" },
    ],
  },
  {
    id: "vets",
    title: "Veterinários recomendados",
    type: "list",
    items: [
      { id: "p3", title: "Dr. Carlos Mendes", subtitle: "4.9★ · Teleconsulta", image: UNSPLASH.vet, href: "/social/perfil/p3", badge: "✓" },
      { id: "p4", title: "VetCare Premium", subtitle: "4.8★ · Emergência 24h", image: UNSPLASH.vet, href: "/social/perfil/p4", badge: "✓" },
    ],
  },
  {
    id: "nearby",
    title: "Perto de você",
    type: "list",
    items: [
      { id: "p5", title: "Pet Shop Amigo", subtitle: "1,2 km · Banho & Tosa", image: UNSPLASH.shop, href: "/social/perfil/p5" },
      { id: "p7", title: "Dog Walker SP", subtitle: "2,1 km · Passeios", image: UNSPLASH.park, href: "/social/perfil/p7" },
    ],
  },
];

function formatCount(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

export function getProfileById(id: string) {
  return MOCK_PROFILES.find((p) => p.id === id);
}

export function getPostById(id: string) {
  return MOCK_POSTS.find((p) => p.id === id);
}

export function getCommentsByPostId(postId: string) {
  return MOCK_COMMENTS.filter((c) => c.postId === postId);
}

export function getPostsByProfileId(profileId: string) {
  return MOCK_POSTS.filter((p) => p.author.id === profileId);
}

export function getReelsByProfileId(profileId: string) {
  return MOCK_REELS.filter((r) => r.author.id === profileId);
}
