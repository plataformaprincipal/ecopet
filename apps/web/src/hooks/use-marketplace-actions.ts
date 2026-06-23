"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { addProductToServerCart, toggleServerFavorite } from "@/lib/marketplace/cart-client";
import { useMarketplaceAuthGate } from "@/hooks/use-marketplace-auth-gate";
import type { MarketplaceProduct, MarketplaceService, MarketplacePartner } from "@/lib/marketplace/types";

export function useMarketplaceActions() {
  const { data: session } = useSession();
  const { requireAuth, AuthModal, isAuthenticated } = useMarketplaceAuthGate();
  const {
    toggleFavoriteProduct,
    toggleFavoriteService,
    toggleFavoritePartner,
    setCartOpen,
    isFavoriteProduct,
    isFavoriteService,
    isFavoritePartner,
  } = useMarketplaceStore();

  const addProductToCart = useCallback(
    (product: MarketplaceProduct, quantity = 1) => {
      requireAuth(async () => {
        if (session?.user?.role === "PARTNER" && session.user.id === product.partnerId) return;
        await addProductToServerCart(product.id, quantity);
        setCartOpen(true);
      });
    },
    [requireAuth, session, setCartOpen]
  );

  const toggleProductFavorite = useCallback(
    (product: MarketplaceProduct) => {
      requireAuth(async () => {
        if (isAuthenticated) {
          try {
            await toggleServerFavorite({ productId: product.id });
          } catch {
            toggleFavoriteProduct(product.id, product);
          }
        } else {
          toggleFavoriteProduct(product.id, product);
        }
      });
    },
    [requireAuth, isAuthenticated, toggleFavoriteProduct]
  );

  const toggleServiceFavorite = useCallback(
    (service: MarketplaceService) => {
      requireAuth(async () => {
        if (isAuthenticated) {
          try {
            await toggleServerFavorite({ serviceId: service.id });
          } catch {
            toggleFavoriteService(service.id, service);
          }
        } else {
          toggleFavoriteService(service.id, service);
        }
      });
    },
    [requireAuth, isAuthenticated, toggleFavoriteService]
  );

  const togglePartnerFavorite = useCallback(
    (partner: MarketplacePartner) => {
      requireAuth(async () => {
        if (isAuthenticated) {
          try {
            await toggleServerFavorite({ partnerId: partner.id });
          } catch {
            toggleFavoritePartner(partner.id, partner);
          }
        } else {
          toggleFavoritePartner(partner.id, partner);
        }
      });
    },
    [requireAuth, isAuthenticated, toggleFavoritePartner]
  );

  return {
    AuthModal,
    requireAuth,
    isAuthenticated,
    addProductToCart,
    toggleProductFavorite,
    toggleServiceFavorite,
    togglePartnerFavorite,
    isFavoriteProduct,
    isFavoriteService,
    isFavoritePartner,
  };
}
