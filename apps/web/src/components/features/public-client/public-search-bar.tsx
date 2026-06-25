"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

type PublicSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
};

export function PublicSearchBar({
  value,
  onChange,
  placeholder,
  className,
  id = "public-search",
  "aria-label": ariaLabel,
}: PublicSearchBarProps) {
  const { t } = useTranslation();
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
        aria-hidden
      />
      <Input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t("pub.search.default")}
        aria-label={ariaLabel ?? t("common.search")}
        className="h-12 rounded-xl border-zinc-200 bg-white pl-11 text-base shadow-sm dark:border-white/10 dark:bg-zinc-900/60"
      />
    </div>
  );
}
