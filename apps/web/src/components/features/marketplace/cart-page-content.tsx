"use client";

import { CartPanel } from "./cart-panel";

/** Fonte canônica do carrinho: servidor `/api/cart` via CartPanel. */
export function CartPageContent() {
  return <CartPanel />;
}
