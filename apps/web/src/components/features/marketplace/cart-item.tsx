"use client";

import Image from "next/image";
import { Heart, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMpPrice } from "@/lib/marketplace/config";
import { firstProductImageUrl, resolveProductAlt } from "@/lib/catalog/images";
import { useTranslation } from "@/providers/i18n-provider";
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
  const alt = resolveProductAlt(item.name);
  const lineTotal = item.unitPrice * item.quantity;

  return (
    <article className="flex gap-3 rounded-[16px] border border-[var(--ep-border)] bg-[var(--card)] p-3 sm:gap-4 sm:p-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-muted)] sm:h-24 sm:w-24">
        {imageUrl ? (
          <Image src={imageUrl} alt={alt} fill className="object-cover" sizes="96px" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--ep-fg-subtle)]" aria-hidden>
            <Heart className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold text-[var(--ep-fg)] sm:text-base">{item.name}</h3>
            {item.sellerName ? (
              <p className="mt-0.5 truncate text-xs text-[var(--ep-fg-muted)]">{item.sellerName}</p>
            ) : null}
            {item.variant ? (
              <p className="mt-0.5 text-xs text-[var(--ep-fg-subtle)]">{item.variant}</p>
            ) : null}
          </div>
          <p className="shrink-0 text-sm font-semibold text-[var(--ep-fg)]">{formatMpPrice(item.unitPrice)}</p>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
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

          <p className="text-sm font-bold text-[var(--ep-fg)]">
            {t("cart.itemSubtotal")} {formatMpPrice(lineTotal)}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {canSave && onSaveForLater ? (
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
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {t("cart.remove")}
          </Button>
        </div>
      </div>
    </article>
  );
}
