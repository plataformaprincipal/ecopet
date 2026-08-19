"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  marketplaceQueryString,
  mergeMarketplaceQuery,
  parseMarketplaceQuery,
  type MarketplaceQuery,
  type MarketplaceResultType,
} from "@/lib/marketplace/query-model";

export function useMarketplaceQuery(defaults?: Partial<MarketplaceQuery>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const defaultType = defaults?.type;

  const query = useMemo((): MarketplaceQuery => {
    const parsed = parseMarketplaceQuery(searchParams);
    const type = parsed.type && parsed.type !== "all" ? parsed.type : defaultType ?? parsed.type;
    return { ...parsed, type };
  }, [searchParams, defaultType]);

  const setQuery = useCallback(
    (patch: Partial<MarketplaceQuery>) => {
      const next = mergeMarketplaceQuery(query, patch);
      const href = `${pathname}${marketplaceQueryString(next)}`;
      router.push(href, { scroll: false });
    },
    [pathname, query, router]
  );

  const replaceQuery = useCallback(
    (next: MarketplaceQuery) => {
      router.replace(`${pathname}${marketplaceQueryString(next)}`, { scroll: false });
    },
    [pathname, router]
  );

  const clearFilters = useCallback(() => {
    const type = (defaults?.type ?? "all") as MarketplaceResultType;
    router.push(`${pathname}${marketplaceQueryString({ type, sort: "relevance", inStock: true })}`, { scroll: false });
  }, [defaults?.type, pathname, router]);

  return { query, setQuery, replaceQuery, clearFilters };
}
