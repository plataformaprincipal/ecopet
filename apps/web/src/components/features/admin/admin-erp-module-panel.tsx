"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminErpShell } from "./erp/admin-erp-shell";
import { adminFetch } from "@/lib/admin/client-api";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import type { AdminModuleConfig } from "@/lib/admin/module-config";

type Props = { config: AdminModuleConfig; initialFilters?: Record<string, string> };

export function AdminErpModulePanel({ config, initialFilters }: Props) {
  const [data, setData] = useState<ErpModuleResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filters, setFilters] = useState<Record<string, string>>({
    page: "1",
    limit: "20",
    ...initialFilters,
  });

  const moduleKey = config.erpModuleId ?? config.id;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setForbidden(false);
    try {
      const q = new URLSearchParams(filters).toString();
      const result = await adminFetch<ErpModuleResponse>(`/api/admin/erp/${moduleKey}${q ? `?${q}` : ""}`);
      setData(result);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("403") || msg.toLowerCase().includes("permiss")) setForbidden(true);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [moduleKey, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminErpShell
      title={config.title}
      description={config.description}
      moduleId={moduleKey}
      data={data}
      loading={loading}
      error={error}
      forbidden={forbidden}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onFilter={(p) => setFilters((f) => ({ ...f, ...p, page: "1" }))}
    />
  );
}
