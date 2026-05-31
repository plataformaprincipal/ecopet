"use client";

import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PetProfilePage() {
  return (
    <>
      <AppHeader title="Perfil do Pet" />
      <main className="flex-1 p-4 lg:p-8">
        <div className="mb-6 flex items-center gap-6">
          <div className="h-24 w-24 rounded-2xl bg-ecopet-green/20" />
          <div>
            <h1 className="font-display text-3xl font-bold">Luna</h1>
            <p className="text-ecopet-gray">Golden Retriever · 3 anos · 28.5kg</p>
          </div>
        </div>
        <Tabs defaultValue="saude" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="saude">Saúde</TabsTrigger>
            <TabsTrigger value="vacinas">Vacinas</TabsTrigger>
            <TabsTrigger value="exames">Exames</TabsTrigger>
            <TabsTrigger value="consultas">Consultas</TabsTrigger>
            <TabsTrigger value="ia">IA</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>
          <TabsContent value="saude">
            <Card>
              <CardHeader>
                <CardTitle>Prontuário Digital</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/5">
                  <p className="font-semibold">Vacina V10</p>
                  <p className="text-sm text-ecopet-gray">Aplicada em 15/06/2025 · Próxima: 15/06/2026</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/5">
                  <p className="font-semibold">Sem alergias registradas</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
