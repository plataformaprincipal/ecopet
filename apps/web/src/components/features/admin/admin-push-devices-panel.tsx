"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "./ui/admin-page-header";

type DeviceRow = {
  id: string;
  userName: string;
  userEmail: string;
  role: string;
  platform: string | null;
  browser: string | null;
  active: boolean;
  failureCount: number;
  lastSeenAt: string;
  lastSuccessAt: string | null;
};

export function AdminPushDevicesPanel() {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/notifications/push/devices", {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "Falha ao carregar dispositivos.");
        return;
      }
      setDevices(json.data.devices as DeviceRow[]);
    } catch {
      setError("Não foi possível carregar dispositivos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Dispositivos Push"
        description="Dispositivos FCM ativos — tokens nunca são exibidos."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Segurança", href: "/admin/seguranca" },
          { label: "Dispositivos" },
        ]}
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            Atualizar
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/integracoes/firebase">Firebase</Link>
          </Button>
        </div>
      </AdminPageHeader>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Dispositivos (até 100)</CardTitle>
          <CardDescription>{devices.length} registro(s)</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-2">Usuário</th>
                  <th className="py-2 pr-2">Role</th>
                  <th className="py-2 pr-2">Plataforma</th>
                  <th className="py-2 pr-2">Browser</th>
                  <th className="py-2 pr-2">Falhas</th>
                  <th className="py-2 pr-2">Último sucesso</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.id} className="border-b border-border/40">
                    <td className="py-2 pr-2">
                      <div>{d.userName}</div>
                      <div className="text-xs text-muted-foreground">{d.userEmail}</div>
                    </td>
                    <td className="py-2 pr-2">{d.role}</td>
                    <td className="py-2 pr-2">{d.platform ?? "—"}</td>
                    <td className="py-2 pr-2">{d.browser ?? "—"}</td>
                    <td className="py-2 pr-2">{d.failureCount}</td>
                    <td className="py-2 pr-2">
                      {d.lastSuccessAt ? new Date(d.lastSuccessAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-muted-foreground">
                      Nenhum dispositivo ativo.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
