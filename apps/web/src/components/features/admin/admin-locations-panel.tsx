"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "./ui/admin-page-header";

export function AdminLocationsPanel() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Localizações"
        description="Mapas administrativos de parceiros e ONGs — sem exibir endereços residenciais de clientes."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Localizações" },
        ]}
      >
        <Button asChild variant="outline">
          <Link href="/admin/integracoes/google-maps">Diagnóstico Maps</Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Parceiros</CardTitle>
            <CardDescription>Estabelecimentos comerciais com coordenadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/parceiros/mapa">Abrir mapa de parceiros</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>ONGs</CardTitle>
            <CardDescription>Somente localização pública autorizada.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/ongs/mapa">Abrir mapa de ONGs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
