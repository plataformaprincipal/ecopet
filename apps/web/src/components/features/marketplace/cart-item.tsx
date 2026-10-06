"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Minus, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMpPrice } from "@/lib/marketplace/config";
import { firstProductImageUrl, resolveProductAlt } from "@/lib/catalog/images";
import { useTranslation } from "@/providers/i18n-provider";
import { typeLabel } from "@/lib/cart/universal";
import type { ServerCartItem } from "@/lib/marketplace/cart-client";

interface CartItemProps {
  item: ServerCartItem;
  busy?: boolean;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
  onSaveForLater?: () => void;
  canSave?: boolean;
}

export function CartItem({
  item,
  busy,
  onQuantity,
  onRemove,
  onSaveForLater,
  canSave,
}: CartItemProps) {
  const { t } = useTranslation();
  const imageUrl = item.image ?? firstProductImageUrl(item.images);
  const alt = resolveProductAlt(item.title || item.name);
  const lineTotal = item.payable ? item.total : item.unitPrice * item.quantity;
  const blocked = !item.payable;

  return (
    <article
      className="flex gap-3 rounded-[16px] border border-[var(--ep-border)] bg-[var(--card)] p-3 sm:gap-4 sm:p-4"
      aria-busy={busy}
    >
      <div className="relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-muted)] sm:h-24 sm:w-24">
        {imageUrl ? (
          <Image src={imageUrl} alt={alt} fill className="object-cover" sizes="96px" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--ep-fg-subtle)]" aria-hidden>
            {item.type === "AI_PRODUCT" || item.type === "AI_CREDIT" ? (
              <Sparkles className="h-6 w-6" />
            ) : (
              <Heart className="h-6 w-6" />
            )}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold text-[var(--ep-fg)] sm:text-base">
              {item.title || item.name}
            </h3>
            <p className="mt-0.5 truncate text-xs text-[var(--ep-fg-muted)]">{item.sellerName}</p>
            <p className="mt-0.5 text-xs text-[var(--ep-fg-subtle)]">{typeLabel(item.type)}</p>
            {item.subtitle ? (
              <p className="mt-0.5 text-xs text-[var(--ep-fg-subtle)]">{item.subtitle}</p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            {item.originalPrice != null ? (
              <p className="text-xs text-[var(--ep-fg-subtle)] line-through">{formatMpPrice(item.originalPrice)}</p>
            ) : null}
            <p className="text-sm font-semibold text-[var(--ep-fg)]">{formatMpPrice(item.unitPrice)}</p>
          </div>
        </div>

        {item.availabilityMessage ? (
          <p className="mt-2 text-xs text-[var(--ep-danger)]" role="status">
            {item.availabilityMessage}
          </p>
        ) : (
          <p className="mt-2 text-xs text-ecopet-green">{t("cart.available")}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {item.quantityApplies ? (
            <div className="inline-flex items-center rounded-xl border border-[var(--ep-border)]">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-l-xl"
                disabled={busy || item.quantity <= 1}
                onClick={() => onQuantity(item.quantity - 1)}
                aria-label={t("cart.decreaseQty")}
              >
                <Minus className="h-4 w-4" aria-hidden />
              </Button>
              <span className="min-w-8 text-center text-sm font-semibold" aria-live="polite">
                {item.quantity}
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-r-xl"
                disabled={busy || item.quantity >= item.stock}
                onClick={() => onQuantity(item.quantity + 1)}
                aria-label={t("cart.increaseQty")}
              >
                <Plus className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ) : (
            <p className="text-xs text-[var(--ep-fg-muted)]">
              {item.billingType === "SUBSCRIPTION" ? t("cart.recurringItem") : t("cart.singleItem")}
            </p>
          )}

          <p className="text-sm font-bold text-[var(--ep-fg)]">
            {t("cart.itemSubtotal")} {formatMpPrice(lineTotal)}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {item.detailsHref ? (
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link href={item.detailsHref}>{t("cart.viewDetails")}</Link>
            </Button>
          ) : null}
          {canSave && onSaveForLater && item.productId ? (
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onSaveForLater}>
              {t("cart.saveForLater")}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-[var(--ep-danger)]"
            disabled={busy}
            onClick={onRemove}
            aria-label={`${t("cart.remove")} ${item.title || item.name}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {t("cart.remove")}
          </Button>
        </div>
        {blocked ? <p className="sr-only">{t("cart.itemBlocked")}</p> : null}
      </div>
    </article>
  );
}
