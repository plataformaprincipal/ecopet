"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAddressAutocomplete } from "@/hooks/use-address-autocomplete";
import type { StructuredAddress } from "@/lib/google-maps/types";
import { useTranslation } from "@/providers/i18n-provider";
import { isGoogleMapsClientReady } from "@/lib/google-maps/config";

export function AddressAutocomplete({
  onSelect,
  disabled,
  className,
}: {
  onSelect: (address: StructuredAddress) => void;
  disabled?: boolean;
  className?: string;
}) {
  const { t, locale } = useTranslation();
  const listId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  const ac = useAddressAutocomplete({
    enabled: isGoogleMapsClientReady(),
    language: locale,
  });

  if (!ac.configured) return null;

  async function choose(placeId: string) {
    const addr = await ac.selectPlace(placeId);
    if (addr) {
      onSelect(addr);
      ac.setQuery(addr.formattedAddress || addr.street);
      ac.clearSuggestions();
      setActiveIndex(-1);
    }
  }

  return (
    <div className={className}>
      <label htmlFor={`${listId}-input`} className="mb-1 block text-sm font-medium">
        {t("maps.searchAddress")}
      </label>
      <div className="relative">
        <Input
          id={`${listId}-input`}
          value={ac.query}
          disabled={disabled || !ac.mapsReady}
          onChange={(e) => {
            ac.setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={(e) => {
            if (!ac.suggestions.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(ac.suggestions.length - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(0, i - 1));
            } else if (e.key === "Enter" && activeIndex >= 0) {
              e.preventDefault();
              void choose(ac.suggestions[activeIndex].placeId);
            } else if (e.key === "Escape") {
              ac.clearSuggestions();
            }
          }}
          placeholder={t("maps.searchAddressPlaceholder")}
          autoComplete="off"
          role="combobox"
          aria-expanded={ac.suggestions.length > 0}
          aria-controls={`${listId}-list`}
          aria-autocomplete="list"
        />
        {ac.loading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />
        ) : null}
      </div>
      {ac.suggestions.length > 0 ? (
        <ul
          id={`${listId}-list`}
          role="listbox"
          className="mt-1 max-h-56 overflow-auto rounded-md border bg-white shadow-sm dark:bg-ecopet-dark"
        >
          {ac.suggestions.map((s, idx) => (
            <li key={s.placeId} role="option" aria-selected={idx === activeIndex}>
              <button
                type="button"
                className={`w-full px-3 py-2 text-left text-sm hover:bg-ecopet-green/10 ${
                  idx === activeIndex ? "bg-ecopet-green/10" : ""
                }`}
                onClick={() => void choose(s.placeId)}
              >
                <span className="font-medium">{s.mainText}</span>
                {s.secondaryText ? (
                  <span className="block text-xs text-muted-foreground">{s.secondaryText}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {ac.error && ac.error !== "ZERO_RESULTS" ? (
        <p className="mt-1 text-xs text-amber-700" role="status">
          {t("maps.addressNotFound")}
        </p>
      ) : null}
    </div>
  );
}
