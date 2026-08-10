import { redirect } from "next/navigation";

/** Carrinho oficial é o do servidor em /carrinho (não o Zustand legado). */
export default function MarketplaceCarrinhoRedirectPage() {
  redirect("/carrinho");
}
