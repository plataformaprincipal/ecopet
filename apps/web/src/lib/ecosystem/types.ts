export type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected"
  | "expired"
  | "negotiating"
  | "converted"
  | "completed";

export type ChatType =
  | "product_inquiry"
  | "service_inquiry"
  | "custom_quote"
  | "support"
  | "scheduling"
  | "complaint"
  | "negotiation"
  | "system_support"
  | "adoption"
  | "donation"
  | "volunteer"
  | "partnership";

export type AccessRole = "owner" | "admin" | "manager" | "operator" | "viewer" | "guest";

export interface CustomQuote {
  id: string;
  name: string;
  description: string;
  value: number;
  validUntil: string;
  executionDeadline: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  clientId: string;
  clientName: string;
  issuedAt: string;
  status: QuoteStatus;
  includedItems: string[];
  excludedItems: string[];
  conditions: string;
  notes?: string;
  version: number;
  history?: { date: string; action: string; by: string }[];
}

export interface ChatConversation {
  id: string;
  type: ChatType;
  title: string;
  participantName: string;
  participantAvatar: string;
  participantRole: "client" | "partner" | "ngo" | "system" | "volunteer" | "donor";
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  status: "open" | "pending" | "resolved" | "priority";
  assignedTo?: string;
  tags?: string[];
  quoteId?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: "client" | "partner" | "system" | "ai";
  content: string;
  type: "text" | "image" | "file" | "quote" | "system";
  quote?: CustomQuote;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: AccessRole;
  sector: string;
  status: "active" | "invited" | "suspended";
  lastAccess: string;
  permissions: string[];
}

export interface PermissionCategory {
  id: string;
  label: string;
  permissions: { id: string; label: string; actions: ("view" | "create" | "edit" | "delete" | "approve" | "export" | "configure" | "admin")[] }[];
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  products: string[];
  services: string[];
  contractUntil?: string;
  rating: number;
  riskLevel: "low" | "medium" | "high";
  contact: string;
  paymentTerms: string;
  aiNote?: string;
}

export interface QualityMetrics {
  avgRating: number;
  complaints: number;
  returns: number;
  delays: number;
  cancellations: number;
  satisfaction: number;
  responseRate: number;
  completionRate: number;
  serviceQuality: number;
  productQuality: number;
  qualityIndex: number;
  operationalRisk: "low" | "medium" | "high";
  pendingAudits: number;
  badges: string[];
}

export interface InsightMetric {
  id: string;
  label: string;
  value: string | number;
  trend?: string;
  source: "internal" | "instagram" | "whatsapp" | "google" | "marketplace";
}

export interface PartnerSearchGroup {
  partner: import("@/lib/marketplace/types").MarketplacePartner;
  products: import("@/lib/marketplace/types").MarketplaceProduct[];
  services: import("@/lib/marketplace/types").MarketplaceService[];
}
