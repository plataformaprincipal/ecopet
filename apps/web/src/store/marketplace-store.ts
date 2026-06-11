import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, MarketplaceFilters, CustomServiceRequest } from "@/lib/marketplace/types";
import { DEFAULT_FILTERS } from "@/lib/marketplace/types";
import { getQuoteById } from "@/lib/ecosystem/mock-data";

interface MarketplaceState {
  cart: CartItem[];
  favoriteProducts: Set<string>;
  favoriteServices: Set<string>;
  favoritePartners: Set<string>;
  compareItems: { type: "product" | "service"; id: string }[];
  filters: MarketplaceFilters;
  searchHistory: string[];
  cartOpen: boolean;
  searchPanelOpen: boolean;
  aiModalOpen: boolean;
  coupon: string;
  customRequests: CustomServiceRequest[];

  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  cartCount: () => number;
  cartSubtotal: () => number;
  applyCoupon: (code: string) => boolean;
  discount: () => number;
  total: () => number;

  toggleFavoriteProduct: (id: string) => void;
  toggleFavoriteService: (id: string) => void;
  toggleFavoritePartner: (id: string) => void;
  isFavoriteProduct: (id: string) => boolean;
  isFavoriteService: (id: string) => boolean;
  isFavoritePartner: (id: string) => boolean;

  toggleCompare: (type: "product" | "service", id: string) => void;
  isInCompare: (type: "product" | "service", id: string) => boolean;
  clearCompare: () => void;

  setFilters: (f: Partial<MarketplaceFilters>) => void;
  resetFilters: () => void;
  addSearchHistory: (q: string) => void;

  setCartOpen: (open: boolean) => void;
  setSearchPanelOpen: (open: boolean) => void;
  setAiModalOpen: (open: boolean) => void;

  submitCustomRequest: (req: Omit<CustomServiceRequest, "id" | "status" | "createdAt">) => string;
  addQuoteToCart: (quoteId: string) => void;
}

const COUPONS: Record<string, number> = { ECOPET10: 0.1, LUNA15: 0.15, PET20: 0.2 };

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
      cart: [],
      favoriteProducts: new Set<string>(),
      favoriteServices: new Set<string>(),
      favoritePartners: new Set<string>(),
      compareItems: [],
      filters: { ...DEFAULT_FILTERS },
      searchHistory: [],
      cartOpen: false,
      searchPanelOpen: false,
      aiModalOpen: false,
      coupon: "",
      customRequests: [],

      addToCart: (item) =>
        set((s) => {
          const existing = s.cart.find((c) => c.itemId === item.itemId && c.type === item.type);
          if (existing) {
            return {
              cart: s.cart.map((c) =>
                c.id === existing.id ? { ...c, quantity: c.quantity + item.quantity } : c
              ),
              cartOpen: true,
            };
          }
          return {
            cart: [...s.cart, { ...item, id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }],
            cartOpen: true,
          };
        }),

      removeFromCart: (id) => set((s) => ({ cart: s.cart.filter((c) => c.id !== id) })),
      updateQuantity: (id, qty) =>
        set((s) => ({
          cart: s.cart.map((c) => (c.id === id ? { ...c, quantity: Math.max(1, qty) } : c)),
        })),
      clearCart: () => set({ cart: [] }),

      cartCount: () => get().cart.reduce((s, c) => s + c.quantity, 0),
      cartSubtotal: () => get().cart.reduce((s, c) => s + c.price * c.quantity, 0),

      applyCoupon: (code) => {
        if (COUPONS[code.toUpperCase()]) {
          set({ coupon: code.toUpperCase() });
          return true;
        }
        return false;
      },
      discount: () => {
        const sub = get().cartSubtotal();
        const pct = COUPONS[get().coupon] ?? 0;
        return sub * pct;
      },
      total: () => get().cartSubtotal() - get().discount(),

      toggleFavoriteProduct: (id) =>
        set((s) => {
          const next = new Set(s.favoriteProducts);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return { favoriteProducts: next };
        }),
      toggleFavoriteService: (id) =>
        set((s) => {
          const next = new Set(s.favoriteServices);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return { favoriteServices: next };
        }),
      toggleFavoritePartner: (id) =>
        set((s) => {
          const next = new Set(s.favoritePartners);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return { favoritePartners: next };
        }),

      isFavoriteProduct: (id) => get().favoriteProducts.has(id),
      isFavoriteService: (id) => get().favoriteServices.has(id),
      isFavoritePartner: (id) => get().favoritePartners.has(id),

      toggleCompare: (type, id) =>
        set((s) => {
          const exists = s.compareItems.find((c) => c.type === type && c.id === id);
          if (exists) return { compareItems: s.compareItems.filter((c) => !(c.type === type && c.id === id)) };
          if (s.compareItems.length >= 3) return s;
          return { compareItems: [...s.compareItems, { type, id }] };
        }),
      isInCompare: (type, id) => get().compareItems.some((c) => c.type === type && c.id === id),
      clearCompare: () => set({ compareItems: [] }),

      setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
      resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),
      addSearchHistory: (q) =>
        set((s) => ({
          searchHistory: [q, ...s.searchHistory.filter((h) => h !== q)].slice(0, 8),
        })),

      setCartOpen: (open) => set({ cartOpen: open }),
      setSearchPanelOpen: (open) => set({ searchPanelOpen: open }),
      setAiModalOpen: (open) => set({ aiModalOpen: open }),

      submitCustomRequest: (req) => {
        const id = `custom-${Date.now()}`;
        set((s) => ({
          customRequests: [
            {
              ...req,
              id,
              status: "awaiting",
              createdAt: new Date().toISOString(),
              proposals: [],
            },
            ...s.customRequests,
          ],
        }));
        return id;
      },

      addQuoteToCart: (quoteId) => {
        const quote = getQuoteById(quoteId);
        if (!quote) return;
        set((s) => {
          const exists = s.cart.find((c) => c.quoteId === quoteId);
          if (exists) return { cartOpen: true };
          const item: Omit<CartItem, "id"> = {
            type: "quote",
            itemId: quoteId,
            name: quote.name,
            image: quote.partnerAvatar,
            price: quote.value,
            quantity: 1,
            partnerId: quote.partnerId,
            partnerName: quote.partnerName,
            quoteId,
            quoteValidUntil: quote.validUntil,
            executionDeadline: quote.executionDeadline,
            quoteStatus: quote.status,
            quoteDescription: quote.description,
          };
          return {
            cart: [...s.cart, { ...item, id: `cart-quote-${quoteId}-${Date.now()}` }],
            cartOpen: true,
          };
        });
      },
    }),
    {
      name: "ecopet-marketplace-anonymous",
      partialize: (s) => ({
        cart: s.cart,
        favoriteProducts: [...s.favoriteProducts],
        favoriteServices: [...s.favoriteServices],
        favoritePartners: [...s.favoritePartners],
        searchHistory: s.searchHistory,
        customRequests: s.customRequests,
      }),
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown>;
        return {
          ...current,
          ...p,
          favoriteProducts: new Set((p.favoriteProducts as string[]) ?? []),
          favoriteServices: new Set((p.favoriteServices as string[]) ?? []),
          favoritePartners: new Set((p.favoritePartners as string[]) ?? []),
        };
      },
    }
  )
);
