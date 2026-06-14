"use client";

import { CartDrawer } from "./cart-drawer";
import { SearchPanel } from "./search-panel";
import { AiHelpModal } from "./ai-help-modal";
import { FloatingCart } from "./floating-cart";
import { CompareBar } from "./compare-bar";

export function MarketplaceShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CartDrawer />
      <SearchPanel />
      <AiHelpModal />
      <FloatingCart />
      <CompareBar />
    </>
  );
}
