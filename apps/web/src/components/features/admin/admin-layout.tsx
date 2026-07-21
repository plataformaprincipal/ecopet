"use client";

import { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminShellHeader } from "./ui/admin-shell-header";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-ecopet-cream/40 dark:bg-ecopet-dark-bg">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminShellHeader onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
