export const EXPLORE_CATEGORIES = [
  { slug: "pets", label: "Pets", icon: "🐾", href: "/explorar?cat=pets" },
  { slug: "tutores", label: "Tutores", icon: "👤", href: "/explorar?cat=tutores" },
  { slug: "veterinarios", label: "Veterinários", icon: "🩺", href: "/veterinarios" },
  { slug: "clinicas", label: "Clínicas", icon: "🏥", href: "/clinicas" },
  { slug: "petshops", label: "Pet Shops", icon: "🏪", href: "/explorar?cat=petshops" },
  { slug: "servicos", label: "Serviços", icon: "🔧", href: "/marketplace/servicos" },
  { slug: "produtos", label: "Produtos", icon: "📦", href: "/marketplace/produtos" },
  { slug: "adocao", label: "Adoção", icon: "❤️", href: "/adocao" },
  { slug: "ongs", label: "ONGs", icon: "🤝", href: "/explorar?cat=ongs" },
  { slug: "agro", label: "Agro", icon: "🌾", href: "/agro" },
  { slug: "iot", label: "Robôs/IoT", icon: "🤖", href: "/agro/iot" },
  { slug: "conteudos", label: "Conteúdos", icon: "📚", href: "/explorar?cat=conteudos" },
  { slug: "eventos", label: "Eventos", icon: "📅", href: "/explorar?cat=eventos" },
];

export const EXPLORE_TRENDS = [
  { tag: "#GoldenRetriever", posts: "2.4k" },
  { tag: "#BanhoETosa", posts: "890" },
  { tag: "#AdocaoSP", posts: "456" },
  { tag: "#SaudePet", posts: "1.2k" },
  { tag: "#DogWalker", posts: "678" },
];

export const EXPLORE_FEATURED_PETS = [
  { id: "1", name: "Luna", breed: "Golden Retriever", image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&q=80", followers: "12k" },
  { id: "2", name: "Mimi", breed: "Persa", image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&q=80", followers: "8.5k" },
  { id: "3", name: "Thor", breed: "Husky", image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=300&q=80", followers: "5.2k" },
];

export const EXPLORE_NEARBY = [
  { id: "s1", name: "Banho & Tosa Completa", type: "Serviço", distance: "1.2 km", rating: 4.9, href: "/marketplace/servico/srv1" },
  { id: "p1", name: "Ração Premium Golden", type: "Produto", distance: "Entrega 24h", rating: 4.8, href: "/marketplace/produto/prod1" },
  { id: "a1", name: "Mel — SRD para adoção", type: "Adoção", distance: "3.5 km", rating: 5.0, href: "/adocao" },
];
