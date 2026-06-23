export type MarketplaceItemType = "product" | "service" | "custom" | "subscription" | "quote";

export type PartnerType =
  | "petshop"
  | "clinic"
  | "veterinarian"
  | "provider"
  | "ong"
  | "seller"
  | "store";

export type SortOption =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "rating"
  | "distance"
  | "bestseller"
  | "ai"
  | "newest";

export interface MarketplacePartner {
  id: string;
  type: PartnerType;
  name: string;
  tradeName: string;
  legalName?: string;
  avatar: string;
  cover: string;
  description: string;
  location: string;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  salesCount: number;
  responseTime: string;
  isVerified: boolean;
  categories: string[];
  hours: string;
  policies: {
    delivery?: string;
    exchange?: string;
    cancellation?: string;
    refund?: string;
    warranty?: string;
  };
  portfolio: { id: string; type: "image" | "video"; url: string; caption?: string }[];
  productCount?: number;
  serviceCount?: number;
  certifications?: string[];
  qualityIndex?: number;
  completionRate?: number;
  isOpen?: boolean;
  specialties?: string[];
  avgDeliveryDays?: number;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  price: number;
  comparePrice?: number;
  images: string[];
  rating: number;
  reviewCount: number;
  partnerId: string;
  partner: Pick<MarketplacePartner, "id" | "name" | "avatar" | "isVerified" | "location">;
  inStock: boolean;
  deliveryDays: number;
  freeShipping: boolean;
  isPromo: boolean;
  isSponsored?: boolean;
  species?: string[];
  sizes?: string[];
  subscriptionAvailable?: boolean;
  aiTag?: "best_for_pet" | "best_value" | "safest" | "ai_pick";
  specs?: Record<string, string>;
  faq?: { q: string; a: string }[];
}

export interface MarketplaceService {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  durationMin: number;
  image: string;
  rating: number;
  reviewCount: number;
  partnerId: string;
  partner: Pick<MarketplacePartner, "id" | "name" | "avatar" | "isVerified" | "location" | "distanceKm">;
  homeService: boolean;
  inPerson: boolean;
  telehealth: boolean;
  emergency?: boolean;
  availableDates?: string[];
  aiTag?: "ideal_today" | "recommended" | "best_value";
}

export interface MarketplaceReview {
  id: string;
  targetId: string;
  targetType: "product" | "service" | "partner";
  author: string;
  avatar: string;
  rating: number;
  comment: string;
  photos?: string[];
  partnerReply?: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  type: MarketplaceItemType;
  itemId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  partnerId: string;
  partnerName: string;
  variant?: string;
  scheduledAt?: string;
  quoteId?: string;
  quoteValidUntil?: string;
  executionDeadline?: string;
  quoteStatus?: string;
  quoteDescription?: string;
}

export interface AiRecommendation {
  id: string;
  tag: "best_for_pet" | "safest" | "best_value" | "partner_pick" | "ideal_today" | "combo";
  title: string;
  subtitle: string;
  itemType: "product" | "service" | "partner";
  itemId: string;
  image?: string;
  href: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  frequency: string;
  price: number;
  items: string[];
  image: string;
  partnerId: string;
}

export interface CustomServiceRequest {
  id: string;
  petName: string;
  species: string;
  size: string;
  age?: string;
  need: string;
  description: string;
  location: string;
  urgency: string;
  desiredDate?: string;
  desiredTime?: string;
  budget?: number;
  acceptProposals: boolean;
  notes?: string;
  status: "awaiting" | "proposals" | "negotiating" | "hired" | "completed";
  proposals?: { id: string; partnerName: string; price: number; message: string }[];
  createdAt: string;
}

export interface MarketplaceFilters {
  type: "" | MarketplaceItemType;
  category: string;
  subcategory: string;
  location: string;
  maxDistance: number;
  priceMin: number;
  priceMax: number;
  minRating: number;
  freeShipping: boolean;
  homeService: boolean;
  verifiedOnly: boolean;
  promoOnly: boolean;
  subscription: boolean;
  species: string;
  brand: string;
  urgency: string;
  sort: SortOption;
  query: string;
  partnerId?: string;
  city?: string;
  state?: string;
  telehealth?: boolean;
  emergency24h?: boolean;
  inStock?: boolean;
  onlineOnly?: boolean;
  inPersonOnly?: boolean;
  homeServiceOnly?: boolean;
  qualityMin?: number;
}

export const DEFAULT_FILTERS: MarketplaceFilters = {
  type: "",
  category: "",
  subcategory: "",
  location: "",
  maxDistance: 50,
  priceMin: 0,
  priceMax: 2000,
  minRating: 0,
  freeShipping: false,
  homeService: false,
  verifiedOnly: false,
  promoOnly: false,
  subscription: false,
  species: "",
  brand: "",
  urgency: "",
  sort: "relevance",
  query: "",
};
