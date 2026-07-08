"use client";

import { useCallback, useEffect, useState } from "react";
import { PartnerErpShell } from "./partner-erp-shell";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import type { PartnerErpModuleConfig } from "@/lib/partner/erp/module-config";

type Props = { config: PartnerErpModuleConfig };

export function PartnerErpModulePanel({ config }: Props) {
  const [data, setData] = useState<ErpModuleResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/partner/erp/${config.id}`, { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (res.status === 403) {
        setLocked(true);
        return;
      }
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message ?? "Erro ao carregar módulo");
      }
      setData(json.data as ErpModuleResponse);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [config.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PartnerErpShell
      title={config.title}
      description={config.description}
      moduleId={config.id}
      data={data}
      loading={loading}
      error={error}
      locked={locked}
    />
  );
}
