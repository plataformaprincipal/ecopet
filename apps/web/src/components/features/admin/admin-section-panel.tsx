"use client";

import { GestorSectionPanel } from "@/components/features/gestor-admin/gestor-section-panel";
import { AdminHeader } from "./admin-header";

type Props = {
  title: string;
  description?: string;
  endpoint: string;
  exportType?: string;
  showFilters?: boolean;
};

export function AdminSectionPanel({ title, description, endpoint, exportType, showFilters }: Props) {
  return (
    <div>
      <AdminHeader title={title} description={description} />
      <GestorSectionPanel
        title=""
        endpoint={endpoint}
        exportType={exportType}
        showFilters={showFilters}
      />
    </div>
  );
}
