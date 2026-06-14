"use client";

import { AppHeader } from "@/components/layouts/app-header";
import { MarketplaceSubNav } from "./marketplace-sub-nav";

interface MarketplacePageWrapperProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function MarketplacePageWrapper({ title, children, className }: MarketplacePageWrapperProps) {
  return (
    <>
      <AppHeader title={title} />
      <MarketplaceSubNav />
      <main className={className ?? "flex-1 p-4 lg:p-8"}>{children}</main>
    </>
  );
}
