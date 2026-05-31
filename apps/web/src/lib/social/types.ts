export type ProfileType =
  | "tutor"
  | "pet"
  | "veterinarian"
  | "clinic"
  | "ong"
  | "petshop"
  | "provider"
  | "store";

export type PostType =
  | "photo"
  | "video"
  | "reel"
  | "carousel"
  | "poll"
  | "ai_tip"
  | "marketplace"
  | "service"
  | "adoption"
  | "sponsored";

export interface SocialPetRef {
  id: string;
  name: string;
  avatar: string;
  species?: string;
}

export interface SocialProfile {
  id: string;
  type: ProfileType;
  name: string;
  username: string;
  avatar: string;
  cover?: string;
  bio: string;
  location: string;
  isVerified: boolean;
  followers: number;
  following: number;
  rating?: number;
  badges: string[];
  pets?: SocialPetRef[];
  products?: { id: string; name: string; price: number; image: string }[];
  services?: { id: string; name: string; price: number }[];
}

export interface PostMedia {
  url: string;
  type: "image" | "video";
  alt?: string;
}

export interface PostPollOption {
  id: string;
  label: string;
  votes: number;
}

export interface PostMarketplace {
  productId: string;
  name: string;
  price: number;
  image: string;
  cta: "comprar" | "ver";
}

export interface PostService {
  id: string;
  name: string;
  price: number;
  cta: "contratar" | "agendar";
}

export interface PostAdoption {
  petName: string;
  species: string;
  image: string;
}

export interface SocialPost {
  id: string;
  type: PostType;
  author: SocialProfile;
  pet?: SocialPetRef;
  location?: string;
  createdAt: string;
  caption: string;
  hashtags: string[];
  media: PostMedia[];
  likes: number;
  commentsCount: number;
  shares: number;
  saves: number;
  isSponsored?: boolean;
  marketplace?: PostMarketplace;
  service?: PostService;
  adoption?: PostAdoption;
  poll?: { question: string; options: PostPollOption[] };
  aiInsight?: string;
}

export interface SocialComment {
  id: string;
  postId: string;
  author: Pick<SocialProfile, "id" | "name" | "username" | "avatar" | "isVerified">;
  content: string;
  createdAt: string;
  likes: number;
  replies?: SocialComment[];
  aiSuggested?: boolean;
}

export interface SocialStory {
  id: string;
  profile: Pick<SocialProfile, "id" | "name" | "avatar" | "type" | "isVerified">;
  preview: string;
  media: PostMedia;
  createdAt: string;
  viewed: boolean;
  isSponsored?: boolean;
  isAdoption?: boolean;
  label?: string;
}

export interface SocialReel {
  id: string;
  author: Pick<SocialProfile, "id" | "name" | "username" | "avatar" | "isVerified" | "type">;
  pet?: SocialPetRef;
  videoUrl: string;
  thumbnail: string;
  caption: string;
  hashtags: string[];
  likes: number;
  commentsCount: number;
  shares: number;
  aiRecommended?: boolean;
  aiReason?: string;
}

export interface TrendTag {
  tag: string;
  posts: number;
  growth: string;
  category: string;
}

export interface AiSuggestion {
  id: string;
  type: "pet" | "product" | "service" | "profile" | "vet" | "content" | "adoption";
  title: string;
  subtitle: string;
  image?: string;
  href: string;
}

export interface AiCommunityInsight {
  id: string;
  icon: "pet" | "trend" | "vet" | "product" | "local";
  text: string;
}

export interface Conversation {
  id: string;
  participant: Pick<SocialProfile, "id" | "name" | "avatar" | "isVerified" | "type">;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  online?: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isMine: boolean;
  type: "text" | "image" | "ai";
}

export interface ExploreSection {
  id: string;
  title: string;
  type: "grid" | "list" | "hashtags";
  items: { id: string; title: string; subtitle?: string; image?: string; href: string; badge?: string }[];
}
