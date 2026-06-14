"use client";

import { AppHeader } from "@/components/layouts/app-header";
import { AgroSubNav } from "./agro-sub-nav";
import { FarmSidebar } from "./farm-sidebar";

interface AgroPageWrapperProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function AgroPageWrapper({ title, children, className }: AgroPageWrapperProps) {
  return (
    <>
      <AppHeader title={title} />
      <AgroSubNav />
      <div className="flex flex-1">
        <FarmSidebar />
        <main className={className ?? "min-w-0 flex-1 p-4 lg:p-8"}>{children}</main>
      </div>
    </>
  );
}
