"use client";

import { useCallback, useEffect, useState } from "react";
import { Battery, Cpu, MapPin, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPageHeader } from "../client-page-header";
import { ClientPageSkeleton } from "../client-skeleton";
import { ClientEmptyState } from "../client-empty-state";
import type { ClientIotPanel } from "@/lib/client/iot-panel";

function fmt(iso: string | null) {
  if (!iso) return "Nunca";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLES: Record<string, string> = {
  online: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  offline: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
  alert: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

export function ClientIotPage() {
  const [data, setData] = useState<ClientIotPanel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/client/iot", { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message ?? "Erro ao carregar IoT");
      setData(json.data.iot as ClientIotPanel);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <ClientPageSkeleton />;
  if (error) {
    return (
      <div className="space-y-4">
        <ClientPageHeader title="IoT" description="Dispositivos conectados dos seus pets." />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30" role="alert">
          {error}
          <Button variant="outline" size="sm" className="ml-3" onClick={load}>Tentar novamente</Button>
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <ClientPageHeader
        title="IoT"
        description="Coleiras, GPS, comedouros, câmeras, balanças, sensores e mais."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Dispositivos" value={data.totalDevices} />
        <MetricCard label="Alertas ativos" value={data.activeAlerts} />
        <MetricCard label="Online" value={data.devices.filter((d) => d.status === "online").length} />
      </div>

      {data.devices.length === 0 ? (
        <ClientEmptyState
          icon={Cpu}
          title="Nenhum dispositivo conectado"
          description="Quando você vincular dispositivos IoT aos seus pets, eles aparecerão aqui com status, bateria e alertas."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.devices.map((d) => (
            <article key={d.id} className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">{d.name}</p>
                  <p className="text-sm text-zinc-500">{d.deviceLabel}{d.petName ? ` · ${d.petName}` : ""}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[d.status] ?? STATUS_STYLES.offline}`}>
                  {d.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
                {d.battery != null && (
                  <span className="flex items-center gap-1"><Battery className="h-3.5 w-3.5" />{d.battery}%</span>
                )}
                <span className="flex items-center gap-1"><Wifi className="h-3.5 w-3.5" />Sync: {fmt(d.lastSyncAt)}</span>
                {d.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{d.location}</span>
                )}
              </div>

              {d.alerts.length > 0 && (
                <div className="mt-3 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/20">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Alertas</p>
                  <ul className="mt-1 space-y-1">
                    {d.alerts.map((a) => (
                      <li key={a.id} className="text-xs text-amber-700 dark:text-amber-300">{a.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {d.recentReadings.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-zinc-500">Últimas leituras</p>
                  <ul className="mt-1 space-y-1">
                    {d.recentReadings.slice(0, 3).map((r, i) => (
                      <li key={`${r.metricKey}-${i}`} className="flex justify-between text-xs">
                        <span className="text-zinc-500">{r.metricKey}</span>
                        <span>{r.value}{r.unit ? ` ${r.unit}` : ""}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 text-center dark:border-white/10 dark:bg-zinc-900/60">
      <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
