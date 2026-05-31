"use client";

import Image from "next/image";
import Link from "next/link";
import {
  PawPrint, Heart, Syringe, Stethoscope, Pill, FileText, Utensils,
  Footprints, Sparkles, Calendar, QrCode, Plus, TrendingUp, AlertTriangle,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_MY_PET } from "@/lib/my-pet/mock-data";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

const healthColors = { excellent: "text-ecopet-green", good: "text-ecopet-green", attention: "text-amber-500" };

export function MyPetDashboard() {
  const { user, loading } = useCurrentUser();
  const hasPet = (user?.pets?.length ?? 0) > 0;
  const pet = MOCK_MY_PET;

  if (!loading && !hasPet) {
    return (
      <>
        <AppHeader title="Meu Pet" />
        <main className="mx-auto max-w-2xl flex-1 p-8 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-ecopet-green/10">
            <PawPrint className="h-12 w-12 text-ecopet-green" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold">Cadastre seu primeiro pet</h1>
          <p className="mt-2 text-ecopet-gray">Central inteligente de saúde, rotina e cuidados do seu companheiro.</p>
          <Link href="/onboarding/pet">
            <Button className="mt-6" size="lg"><Plus className="h-5 w-5" /> Cadastrar meu primeiro pet</Button>
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Meu Pet" />
      <main className="mx-auto max-w-3xl flex-1 p-4 lg:p-6">
        {/* Card principal */}
        <Card className="overflow-hidden border-ecopet-green/20">
          <div className="relative h-32 bg-gradient-to-r from-ecopet-dark to-ecopet-green" />
          <CardContent className="relative -mt-12 px-4 pb-4">
            <div className="flex items-end gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-4 border-white shadow-lg dark:border-[#0f1419]">
                <Image src={pet.photo} alt={pet.name} fill className="object-cover" />
              </div>
              <div className="flex-1 pb-1">
                <h1 className="font-display text-2xl font-bold">{pet.name}</h1>
                <p className="text-sm text-ecopet-gray">{pet.breed} · {pet.species} · {pet.age}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge variant="default">{pet.weight}</Badge>
                  <Badge className={cn("bg-ecopet-green/10", healthColors[pet.healthStatus])}>
                    <Heart className="mr-1 h-3 w-3" /> Saúde {pet.healthStatus === "good" ? "Boa" : "Atenção"}
                  </Badge>
                </div>
              </div>
              <Button size="icon" variant="outline" title="QR Code"><QrCode className="h-5 w-5" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* IA do Pet */}
        <Card className="mt-4 border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-ecopet-green/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-ecopet-yellow" />
              <h2 className="font-semibold">IA do Pet</h2>
            </div>
            <div className="space-y-2">
              {pet.aiAlerts.map((a) => (
                <p key={a.id} className={cn("flex items-start gap-2 text-sm rounded-lg p-2",
                  a.type === "warning" ? "bg-amber-500/10 text-amber-700" :
                  a.type === "health" ? "bg-blue-500/10 text-blue-700" : "bg-ecopet-green/10 text-ecopet-green"
                )}>
                  {a.type !== "info" && <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
                  {a.text}
                </p>
              ))}
            </div>
            <ul className="mt-3 space-y-1 text-xs text-ecopet-gray">
              {pet.aiRecommendations.map((r, i) => <li key={i}>→ {r}</li>)}
            </ul>
          </CardContent>
        </Card>

        <Tabs defaultValue="saude" className="mt-6">
          <TabsList className="mb-4 flex w-full flex-wrap">
            <TabsTrigger value="saude">Saúde</TabsTrigger>
            <TabsTrigger value="rotina">Rotina</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value="saude" className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Syringe className="h-4 w-4" /> Vacinas</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {pet.vaccines.map((v) => (
                  <div key={v.name} className="flex justify-between text-sm border-b border-ecopet-gray/10 pb-2">
                    <span className="font-medium">{v.name}</span>
                    <span className="text-ecopet-gray">Próx: {v.next}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Stethoscope className="h-4 w-4" /> Consultas</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {pet.consultations.map((c, i) => (
                  <div key={i} className="text-sm"><strong>{c.date}</strong> — {c.vet}: {c.reason}</div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Pill className="h-4 w-4" /> Medicamentos</CardTitle></CardHeader>
              <CardContent>
                {pet.medications.map((m, i) => (
                  <p key={i} className="text-sm">{m.name} — {m.dose}</p>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" /> Exames</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {pet.exams.map((e, i) => (
                  <div key={i} className="flex justify-between text-sm"><span>{e.name}</span><Badge variant="default">{e.status}</Badge></div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rotina" className="space-y-3">
            {[
              { icon: Utensils, label: "Alimentação", value: pet.routine.feeding },
              { icon: Footprints, label: "Passeio", value: pet.routine.walk },
              { icon: Sparkles, label: "Banho", value: pet.routine.bath },
              { icon: TrendingUp, label: "Atividade", value: pet.routine.activity },
            ].map(({ icon: Icon, label, value }) => (
              <Card key={label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <Icon className="h-5 w-5 text-ecopet-green" />
                  <div><p className="text-xs text-ecopet-gray">{label}</p><p className="font-medium">{value}</p></div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="servicos" className="space-y-3">
            {pet.scheduledServices.map((s, i) => (
              <Card key={i}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-sm text-ecopet-gray">{s.partner}</p>
                  </div>
                  <Badge><Calendar className="mr-1 h-3 w-3" /> {s.date}</Badge>
                </CardContent>
              </Card>
            ))}
            <Link href="/marketplace/servicos"><Button variant="outline" className="w-full">Agendar serviço</Button></Link>
          </TabsContent>

          <TabsContent value="social">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-xl border p-4"><p className="text-2xl font-bold">{pet.social.posts}</p><p className="text-xs text-ecopet-gray">Posts</p></div>
              <div className="rounded-xl border p-4"><p className="text-2xl font-bold">{pet.social.followers}</p><p className="text-xs text-ecopet-gray">Seguidores</p></div>
              <div className="rounded-xl border p-4"><p className="text-2xl font-bold">{pet.social.likes}</p><p className="text-xs text-ecopet-gray">Curtidas</p></div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
