"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CartItem } from "@/components/features/marketplace/cart-item";
import { firstProductImageUrl, resolveProductAlt } from "@/lib/catalog/images";
import { formatMpPrice } from "@/lib/marketplace/config";
import { useMarketplaceAuthGate } from "@/hooks/use-marketplace-auth-gate";
import { useServerCart } from "@/hooks/use-server-cart";
import { useFoundationSession } from "@/hooks/use-foundation-session";
import { useTranslation } from "@/providers/i18n-provider";
import {
  addProductToServerCart,
  removeServerCartItem,
  toggleServerFavorite,
  updateServerCartItem,
  type ServerCart,
  type ServerCartItem,
} from "@/lib/marketplace/cart-client";
import { cn } from "@/lib/utils";

type RemovedSnapshot = { productId: string; quantity: number; name: string };

export function CartPanel() {
  const { t } = useTranslation();
  const { isAuthenticated } = useFoundationSession();
  const { cart, setCart, loading, error, refresh, itemCount, subtotal, estimatedRewards } = useServerCart();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [couponOk, setCouponOk] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [removed, setRemoved] = useState<RemovedSnapshot | null>(null);

  const items = (cart?.items ?? []).filter((item) => item.itemType !== "DIGITAL_AI");
  const ready = !loading || cart != null;

  async function applyCart(next: ServerCart) {
    setCart(next);
  }

  async function changeQty(item: ServerCartItem, quantity: number) {
    if (!item.productId) return;
    setActionError("");
    const previous = cart;
    if (cart) {
      setCart({
        ...cart,
        items: cart.items.map((row) => (row.id === item.id ? { ...row, quantity } : row)),
        subtotal: cart.items.reduce(
          (sum, row) => sum + row.unitPrice * (row.id === item.id ? quantity : row.quantity),
          0
        ),
      });
    }
    setBusyId(item.id);
    try {
      const next = await updateServerCartItem(item.id, quantity);
      await applyCart(next);
    } catch (e) {
      if (previous) setCart(previous);
      setActionError(e instanceof Error ? e.message : t("cart.qtyUpdateFailed"));
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(item: ServerCartItem) {
    if (!item.productId) return;
    setActionError("");
    setBusyId(item.id);
    try {
      const next = await removeServerCartItem(item.id);
      await applyCart(next);
      setRemoved({ productId: item.productId, quantity: item.quantity, name: item.name });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t("cart.qtyUpdateFailed"));
    } finally {
      setBusyId(null);
    }
  }

  async function undoRemove() {
    if (!removed) return;
    setActionError("");
    try {
      const next = await addProductToServerCart(removed.productId, removed.quantity);
      await applyCart(next);
      setRemoved(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t("cart.qtyUpdateFailed"));
    }
  }

  async function saveForLater(item: ServerCartItem) {
    if (!item.productId) return;
    if (!isAuthenticated) {
      setActionError(t("cart.signInToSave"));
      return;
    }
    setBusyId(item.id);
    try {
      await toggleServerFavorite({ productId: item.productId });
      const next = await removeServerCartItem(item.id);
      await applyCart(next);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t("cart.qtyUpdateFailed"));
    } finally {
      setBusyId(null);
    }
  }

  async function tryCoupon() {
    setCouponMsg("");
    setCouponOk(false);
    if (!isAuthenticated) {
      setCouponMsg(t("cart.couponSignIn"));
      return;
    }
    const res = await fetch("/api/client/coupons/preview", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponInput }),
    });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      setCouponDiscount(0);
      setCouponMsg(json.error?.message ?? t("cart.couponInvalid"));
      return;
    }
    setCouponOk(true);
    setCouponDiscount(Number(json.data.discountAmount) || 0);
    setCouponMsg(t("cart.couponApplied"));
  }

  const total = Math.max(0, subtotal - couponDiscount);

  if (!ready) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <p className="sr-only">{t("cart.loading")}</p>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <p className="text-sm text-[var(--ep-danger)]" role="alert">
        {error}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center rounded-[16px] border border-dashed border-[var(--ep-border)] bg-[var(--card)] px-6 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ecopet-green/10">
          <ShoppingBag className="h-8 w-8 text-ecopet-green" aria-hidden />
        </div>
        <h1 className="font-display text-xl font-bold text-[var(--ep-fg)]">{t("cart.emptyTitle")}</h1>
        <p className="mt-2 max-w-sm text-sm text-[var(--ep-fg-muted)]">{t("cart.emptyDescription")}</p>
        <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/marketplace">{t("cart.exploreProducts")}</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/servicos">{t("cart.findServices")}</Link>
          </Button>
        </div>
        <Link href="/" className="mt-4 text-sm font-medium text-ecopet-green hover:underline">
          {t("cart.continueExploring")}
        </Link>
        {removed ? (
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-[var(--surface-muted)] px-4 py-3 text-sm">
            <span>{t("cart.removed")}</span>
            <Button type="button" size="sm" variant="ghost" onClick={() => void undoRemove()}>
              {t("cart.undo")}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-0">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--ep-fg)]">{t("cart.title")}</h1>
        <p className="mt-1 text-sm text-[var(--ep-fg-muted)]">
          {itemCount} {itemCount === 1 ? t("cart.itemSingular") : t("cart.itemPlural")}
        </p>
      </div>

      {actionError ? (
        <p className="mb-4 text-sm text-[var(--ep-danger)]" role="alert">
          {actionError}
        </p>
      ) : null}

      {removed ? (
        <div
          className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--ep-border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm"
          role="status"
        >
          <span>{t("cart.removed")}</span>
          <Button type="button" size="sm" variant="ghost" onClick={() => void undoRemove()}>
            {t("cart.undo")}
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          {items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              busy={busyId === item.id}
              onQuantity={(qty) => void changeQty(item, qty)}
              onRemove={() => void removeItem(item)}
              onSaveForLater={() => void saveForLater(item)}
              canSave
            />
          ))}
        </div>

        <aside className="hidden h-fit rounded-[16px] border border-[var(--ep-border)] bg-[var(--card)] p-5 lg:sticky lg:top-24 lg:block">
          <h2 className="font-display text-lg font-semibold">{t("cart.summary")}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--ep-fg-muted)]">{t("cart.subtotal")}</dt>
              <dd>{formatMpPrice(subtotal)}</dd>
            </div>
            {couponDiscount > 0 ? (
              <div className="flex justify-between text-ecopet-green">
                <dt>{t("cart.discounts")}</dt>
                <dd>-{formatMpPrice(couponDiscount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-[var(--ep-fg-muted)]">{t("cart.shipping")}</dt>
              <dd className="text-[var(--ep-fg-muted)]">{t("cart.shippingCheckout")}</dd>
            </div>
            {estimatedRewards > 0 ? (
              <div className="flex justify-between text-[var(--ep-fg-muted)]">
                <dt>{t("cart.rewardsEarn").replace("{points}", String(estimatedRewards))}</dt>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-[var(--ep-border)] pt-3 text-base font-bold">
              <dt>{t("cart.total")}</dt>
              <dd className="text-ecopet-green">{formatMpPrice(total)}</dd>
            </div>
          </dl>

          <Button asChild size="lg" className="mt-5 w-full" disabled={Boolean(cart?.multiPartner)}>
            <Link href="/checkout">{t("cart.continueToPayment")}</Link>
          </Button>
          {cart?.multiPartner ? (
            <p className="mt-2 text-xs text-[var(--ep-danger)]">{t("cart.multiPartner")}</p>
          ) : null}

          <div className="mt-4">
            <button
              type="button"
              className="text-sm font-medium text-ecopet-green hover:underline"
              aria-expanded={couponOpen}
              onClick={() => setCouponOpen((v) => !v)}
            >
              {t("cart.haveCoupon")}
            </button>
            {couponOpen ? (
              <div className="mt-3 flex gap-2">
                <Input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder={t("cart.couponPlaceholder")}
                  aria-label={t("cart.couponPlaceholder")}
                />
                <Button type="button" variant="outline" onClick={() => void tryCoupon()}>
                  {t("cart.apply")}
                </Button>
              </div>
            ) : null}
            {couponMsg ? (
              <p className={cn("mt-2 text-xs", couponOk ? "text-ecopet-green" : "text-[var(--ep-danger)]")}>
                {couponMsg}
              </p>
            ) : null}
          </div>
        </aside>
      </div>

      <div
        className="fixed inset-x-0 z-40 border-t border-[var(--ep-border)] bg-[var(--bottom-nav)]/95 px-4 py-3 backdrop-blur-md lg:hidden"
        style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[var(--ep-fg-muted)]">{t("cart.total")}</p>
            <p className="text-lg font-bold text-[var(--ep-fg)]">{formatMpPrice(total)}</p>
          </div>
          <Button asChild disabled={Boolean(cart?.multiPartner)}>
            <Link href="/checkout">{t("cart.continueToPayment")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PublicProductDetail() {
  const params = useParams();
  const id = String(params.productId);
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState("");
  const { requireAuth, AuthModal } = useMarketplaceAuthGate();

  useEffect(() => {
    fetch(`/api/public/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProduct(d.data.product);
      });
  }, [id]);

  async function addToCart() {
    requireAuth(async () => {
      setMsg("");
      const res = await fetch("/api/cart/items", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, quantity: 1 }),
      });
      const data = await res.json();
      setMsg(data.success ? "Adicionado ao carrinho." : data.error?.message ?? "Erro");
    });
  }

  if (!product) return <p>Carregando...</p>;

  const images = product.images as string[] | undefined;
  const imageUrl = firstProductImageUrl(images);
  const extra = product.extraDetails as { imageAlt?: string } | null;
  const alt = resolveProductAlt(
    String(product.name),
    product.sku ? String(product.sku) : null,
    product.shortDescription ? String(product.shortDescription) : null,
    extra
  );

  return (
    <>
      {AuthModal}
      <Card>
        <CardContent className="space-y-4 p-6">
          {imageUrl && (
            <div className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-xl border bg-[var(--surface-muted)]">
              <Image src={imageUrl} alt={alt} fill className="object-contain p-4" priority unoptimized />
            </div>
          )}
          <h1 className="text-2xl font-semibold">{String(product.name)}</h1>
          <p>{String(product.description)}</p>
          <p className="font-medium">R$ {Number(product.price).toFixed(2)}</p>
          <p className="text-sm">Estoque: {Number(product.stock)}</p>
          <Button onClick={addToCart} disabled={Number(product.stock) <= 0}>
            Adicionar ao carrinho
          </Button>
          {msg && <p className="text-sm">{msg}</p>}
          <Button asChild variant="ghost">
            <Link href="/produtos">Voltar</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
