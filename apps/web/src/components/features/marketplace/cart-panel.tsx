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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CartItem } from "@/components/features/marketplace/cart-item";
import { firstProductImageUrl, resolveProductAlt } from "@/lib/catalog/images";
import { formatMpPrice } from "@/lib/marketplace/config";
import { useMarketplaceAuthGate } from "@/hooks/use-marketplace-auth-gate";
import { useServerCart } from "@/hooks/use-server-cart";
import { useFoundationSession } from "@/hooks/use-foundation-session";
import { useTranslation } from "@/providers/i18n-provider";
import {
  addProductToServerCart,
  clearServerCart,
  removeServerCartItem,
  toggleServerFavorite,
  updateServerCartItem,
  type ServerCart,
  type ServerCartItem,
} from "@/lib/marketplace/cart-client";
import { cn } from "@/lib/utils";

type RemovedSnapshot = { productId: string | null; quantity: number; name: string };

function SummaryRows({
  cart,
  couponDiscount,
  total,
}: {
  cart: ServerCart;
  couponDiscount: number;
  total: number;
}) {
  const { t } = useTranslation();
  const summary = cart.summary;
  return (
    <dl className="mt-4 space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-[var(--ep-fg-muted)]">{t("cart.products")}</dt>
        <dd>{formatMpPrice(summary?.products ?? cart.productSubtotal ?? 0)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-[var(--ep-fg-muted)]">{t("cart.services")}</dt>
        <dd>{formatMpPrice(summary?.services ?? 0)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-[var(--ep-fg-muted)]">{t("cart.ai")}</dt>
        <dd>{formatMpPrice(summary?.ai ?? cart.aiSubtotal ?? 0)}</dd>
      </div>
      {couponDiscount > 0 || (cart.discount ?? 0) > 0 ? (
        <div className="flex justify-between text-ecopet-green">
          <dt>{t("cart.discounts")}</dt>
          <dd>-{formatMpPrice(couponDiscount + (cart.discount ?? 0))}</dd>
        </div>
      ) : null}
      <div className="flex justify-between">
        <dt className="text-[var(--ep-fg-muted)]">{t("cart.shipping")}</dt>
        <dd className="text-[var(--ep-fg-muted)]">{t("cart.shippingCheckout")}</dd>
      </div>
      {(cart.estimatedRewards ?? 0) > 0 ? (
        <div className="flex justify-between text-[var(--ep-fg-muted)]">
          <dt>{t("cart.rewardsEarn").replace("{points}", String(cart.estimatedRewards))}</dt>
        </div>
      ) : null}
      <div className="flex justify-between border-t border-[var(--ep-border)] pt-3 text-base font-bold">
        <dt>{cart.hasSubscription ? t("cart.payToday") : t("cart.total")}</dt>
        <dd className="text-ecopet-green">{formatMpPrice(total)}</dd>
      </div>
      {cart.hasSubscription ? (
        <div className="flex justify-between text-sm">
          <dt className="text-[var(--ep-fg-muted)]">{t("cart.recurring")}</dt>
          <dd>{formatMpPrice(cart.recurringMonthly ?? 0)}{t("cart.perMonth")}</dd>
        </div>
      ) : null}
    </dl>
  );
}

export function CartPanel() {
  const { t } = useTranslation();
  const { isAuthenticated } = useFoundationSession();
  const { cart, setCart, loading, error, itemCount, subtotal } = useServerCart();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [couponOk, setCouponOk] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [removed, setRemoved] = useState<RemovedSnapshot | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const items = cart?.items ?? [];
  const groups = cart?.groups?.length
    ? cart.groups
    : [{ sellerId: "all", sellerName: "", sellerType: "ECCOPET" as const, items, subtotal }];
  const ready = !loading || cart != null;
  const blocked = (cart?.blockedCount ?? 0) > 0;
  const ctaDisabled = items.length === 0 || blocked;

  async function applyCart(next: ServerCart) {
    setCart(next);
  }

  async function changeQty(item: ServerCartItem, quantity: number) {
    if (!item.quantityApplies) return;
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
    setActionError("");
    setBusyId(item.id);
    try {
      const next = await removeServerCartItem(item.id);
      await applyCart(next);
      setRemoved({ productId: item.productId, quantity: item.quantity, name: item.title || item.name });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t("cart.qtyUpdateFailed"));
    } finally {
      setBusyId(null);
    }
  }

  async function undoRemove() {
    if (!removed?.productId) return;
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

  async function confirmClear() {
    setClearing(true);
    setActionError("");
    try {
      const next = await clearServerCart();
      await applyCart(next);
      setClearOpen(false);
      setRemoved(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t("cart.clearFailed"));
    } finally {
      setClearing(false);
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
            <Link href="/marketplace">{t("cart.exploreMarketplace")}</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/eccopet">{t("cart.exploreAi")}</Link>
          </Button>
        </div>
        {removed ? (
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-[var(--surface-muted)] px-4 py-3 text-sm" role="status">
            <span>{t("cart.removed")}</span>
            {removed.productId ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => void undoRemove()}>
                {t("cart.undo")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-0">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ep-fg)]">{t("cart.title")}</h1>
          <p className="mt-1 text-sm text-[var(--ep-fg-muted)]">
            {itemCount} {itemCount === 1 ? t("cart.itemSingular") : t("cart.itemPlural")}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" className="text-[var(--ep-fg-muted)]" onClick={() => setClearOpen(true)}>
          {t("cart.clearCart")}
        </Button>
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
          {removed.productId ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => void undoRemove()}>
              {t("cart.undo")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {cart?.hasSubscription ? (
        <p className="mb-4 rounded-xl border border-[var(--ep-border)] bg-[var(--surface-muted)] px-4 py-3 text-sm">
          {t("cart.subscriptionNotice")}
        </p>
      ) : null}

      {cart?.multiPartner ? (
        <p className="mb-4 rounded-xl border border-[var(--ep-border)] bg-[var(--surface-muted)] px-4 py-3 text-sm">
          {t("cart.multiSellerNotice")}
        </p>
      ) : null}

      {blocked ? (
        <p className="mb-4 text-sm text-[var(--ep-danger)]" role="alert">
          {t("cart.blockedNotice")}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="max-h-[min(70vh,44rem)] space-y-6 overflow-y-auto overflow-x-visible pr-1 lg:max-h-[calc(100vh-10rem)]">
          {groups.map((group) => (
            <section key={group.sellerId} className="space-y-3">
              {group.sellerName ? (
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-[var(--ep-fg-muted)]">
                  {group.sellerName}
                </h2>
              ) : null}
              {group.items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  busy={busyId === item.id}
                  onQuantity={(qty) => void changeQty(item, qty)}
                  onRemove={() => void removeItem(item)}
                  onSaveForLater={() => void saveForLater(item)}
                  canSave={Boolean(item.productId)}
                />
              ))}
            </section>
          ))}
        </div>

        <aside className="hidden h-fit rounded-[16px] border border-[var(--ep-border)] bg-[var(--card)] p-5 lg:sticky lg:top-24 lg:block">
          <h2 className="font-display text-lg font-semibold">{t("cart.summary")}</h2>
          {cart ? <SummaryRows cart={cart} couponDiscount={couponDiscount} total={total} /> : null}

          <Button asChild size="lg" className="mt-5 w-full" disabled={ctaDisabled}>
            <Link href="/checkout">{t("cart.continueToPayment")}</Link>
          </Button>
          <p className="mt-2 text-center text-sm font-semibold text-ecopet-green">{formatMpPrice(total)}</p>

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
          <Button asChild disabled={ctaDisabled}>
            <Link href="/checkout">{t("cart.continueToPayment")}</Link>
          </Button>
        </div>
      </div>

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cart.clearConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("cart.clearConfirmBody")}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setClearOpen(false)}>
              {t("cart.cancel")}
            </Button>
            <Button type="button" variant="destructive" disabled={clearing} onClick={() => void confirmClear()}>
              {t("cart.clearCart")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PublicProductDetail() {
  const params = useParams();
  const id = String(params.productId);
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState("");
  const [qty, setQty] = useState(1);
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
        body: JSON.stringify({ productId: id, quantity: qty }),
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
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border" role="group" aria-label="Quantidade">
              <button type="button" className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuir quantidade">
                −
              </button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button
                type="button"
                className="px-3 py-2"
                onClick={() => setQty((q) => Math.min(Math.max(1, Number(product.stock) || 1), q + 1))}
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>
            <Button onClick={() => void addToCart()} disabled={Number(product.stock) <= 0}>
              Adicionar ao carrinho
            </Button>
          </div>
          {msg && <p className="text-sm">{msg}</p>}
          <Button asChild variant="ghost">
            <Link href="/produtos">Voltar</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
