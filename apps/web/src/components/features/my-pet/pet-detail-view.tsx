"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle, Heart, QrCode, Sparkles, Syringe, Stethoscope, Pill,
  Scale, ImageIcon, PawPrint, History, Search, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeightChart } from "./weight-chart";
import { petsApi } from "@/lib/pets/api";
import type { PetDetail } from "@/lib/pets/types";
import {
  SPECIES_LABELS, SIZE_LABELS, MEDICAL_TYPE_LABELS, EVENT_TYPE_LABELS,
  DEFAULT_PET_PHOTO, VACCINE_PRESETS, computeAgeFromBirthDate,
} from "@/lib/pets/labels";
import { cn } from "@/lib/utils";

interface PetDetailViewProps {
  pet: PetDetail;
  token: string;
  onRefresh: () => void;
}

function SectionForm({
  title,
  children,
  onSubmit,
  loading,
}: {
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  loading?: boolean;
}) {
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {children}
        <Button size="sm" onClick={onSubmit} disabled={loading}>{loading ? "Salvando..." : "Registrar"}</Button>
      </CardContent>
    </Card>
  );
}

export function PetDetailView({ pet, token, onRefresh }: PetDetailViewProps) {
  const api = petsApi(token);
  const [loading, setLoading] = useState(false);
  const [medical, setMedical] = useState({ type: "CONSULTATION", title: "", veterinarianName: "", clinicName: "", content: "", recordDate: "" });
  const [vaccine, setVaccine] = useState({ name: "V10", manufacturer: "", batch: "", date: "", nextDue: "", veterinarian: "" });
  const [medication, setMedication] = useState({ name: "", dosage: "", frequency: "", startDate: "", endDate: "", notes: "" });
  const [weight, setWeight] = useState({ weight: "", notes: "" });
  const [media, setMedia] = useState({ url: "", caption: "", type: "photo" as "photo" | "video" });
  const [lost, setLost] = useState({ lostCity: pet.locationCity ?? "", lostContact: "" });
  const [adoption, setAdoption] = useState({
    adoptionReason: pet.adoptionReason ?? "",
    adoptionRequirements: pet.adoptionRequirements ?? "",
    adoptionCity: pet.adoptionCity ?? "",
    adoptionFee: pet.adoptionFee?.toString() ?? "",
  });

  const run = useCallback(async (fn: () => Promise<unknown>) => {
    setLoading(true);
    try {
      await fn();
      onRefresh();
    } finally {
      setLoading(false);
    }
  }, [onRefresh]);

  const photo = pet.photo || DEFAULT_PET_PHOTO;
  const publicUrl = pet.qrCodeSlug ? `/pet/${pet.qrCodeSlug}` : null;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-ecopet-green/20">
        <div className="relative h-28 bg-gradient-to-r from-ecopet-dark to-ecopet-green" />
        <CardContent className="relative -mt-12 px-4 pb-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-4 border-white shadow-lg dark:border-[#0f1419]">
              <Image src={photo} alt={pet.name} fill className="object-cover" unoptimized />
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold">{pet.name}</h1>
                {pet.isLost && <Badge variant="destructive">Perdido</Badge>}
                {pet.availableForAdoption && <Badge className="bg-ecopet-yellow text-ecopet-dark">Adoção</Badge>}
              </div>
              <p className="text-sm text-ecopet-gray">
                {pet.breed} · {SPECIES_LABELS[pet.species]} · {pet.age ?? computeAgeFromBirthDate(pet.birthDate)}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {pet.weight != null && <Badge variant="default">{pet.weight} kg</Badge>}
                {pet.size && <Badge variant="outline">{SIZE_LABELS[pet.size]}</Badge>}
                <Badge className="bg-ecopet-green/10 text-ecopet-green"><Heart className="mr-1 h-3 w-3" /> Ativo</Badge>
              </div>
            </div>
            {publicUrl && (
              <Button size="icon" variant="outline" asChild title="Página pública / QR Code">
                <Link href={publicUrl} target="_blank"><QrCode className="h-5 w-5" /></Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {(pet.vaccineAlerts?.length ?? 0) > 0 && (
        <Card className="border-amber-500/30 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="space-y-2 p-4">
            {pet.vaccineAlerts!.map((a) => (
              <p key={a.name} className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {a.message}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-ecopet-green/5">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-ecopet-yellow" />
            <h2 className="font-semibold">IA Pet (estrutura preparada)</h2>
          </div>
          <p className="text-sm text-ecopet-gray">
            Futuramente analisará sintomas, vacinas atrasadas, histórico médico, peso e alimentação.
          </p>
          <ul className="mt-2 space-y-1 text-xs text-ecopet-gray">
            {(pet.aiProfile?.capabilities ?? ["symptoms", "vaccines", "medical_history", "weight", "feeding"]).map((c) => (
              <li key={c}>→ {c.replace(/_/g, " ")}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Tabs defaultValue="dados">
        <TabsList className="mb-4 flex h-auto w-full flex-wrap">
          <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
          <TabsTrigger value="saude">Saúde</TabsTrigger>
          <TabsTrigger value="vacinas">Vacinas</TabsTrigger>
          <TabsTrigger value="medicacoes">Medicações</TabsTrigger>
          <TabsTrigger value="peso">Peso</TabsTrigger>
          <TabsTrigger value="fotos">Fotos</TabsTrigger>
          <TabsTrigger value="adocao">Adoção</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-4">
          <Card>
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 text-sm">
              <div><span className="text-ecopet-gray">Sexo:</span> {pet.sex === "M" ? "Macho" : pet.sex === "F" ? "Fêmea" : pet.sex ?? "—"}</div>
              <div><span className="text-ecopet-gray">Nascimento:</span> {pet.birthDate ? new Date(pet.birthDate).toLocaleDateString("pt-BR") : "—"}</div>
              <div><span className="text-ecopet-gray">Idade:</span> {pet.age ?? computeAgeFromBirthDate(pet.birthDate)}</div>
              <div><span className="text-ecopet-gray">Cor:</span> {pet.color ?? "—"}</div>
              <div><span className="text-ecopet-gray">Castrado:</span> {pet.neutered ? "Sim" : "Não"}</div>
              <div><span className="text-ecopet-gray">Microchip:</span> {pet.hasMicrochip ? pet.microchip ?? "Sim" : "Não"}</div>
              <div><span className="text-ecopet-gray">Tutor:</span> {pet.owner?.name ?? "—"}</div>
              <div><span className="text-ecopet-gray">ONG:</span> {pet.ong?.name ?? "—"}</div>
              <div><span className="text-ecopet-gray">Protetor:</span> {pet.protector?.name ?? "—"}</div>
              <div><span className="text-ecopet-gray">Cidade:</span> {pet.locationCity ?? "—"} / {pet.locationState ?? "—"}</div>
              {pet.temperament && <div className="sm:col-span-2"><span className="text-ecopet-gray">Temperamento:</span> {pet.temperament}</div>}
              {pet.rescueHistory && <div className="sm:col-span-2"><span className="text-ecopet-gray">Resgate:</span> {pet.rescueHistory}</div>}
              {pet.specialNeeds && <div className="sm:col-span-2"><span className="text-ecopet-gray">Necessidades:</span> {pet.specialNeeds}</div>}
              {pet.dietaryRestriction && <div className="sm:col-span-2"><span className="text-ecopet-gray">Restrição alimentar:</span> {pet.dietaryRestriction}</div>}
              {pet.allergiesText && <div className="sm:col-span-2"><span className="text-ecopet-gray">Alergias:</span> {pet.allergiesText}</div>}
              {pet.notes && <div className="sm:col-span-2"><span className="text-ecopet-gray">Observações:</span> {pet.notes}</div>}
            </CardContent>
          </Card>
          <div className="flex flex-wrap gap-2">
            {!pet.isLost ? (
              <Button variant="destructive" size="sm" onClick={() => run(() => api.markLost(pet.id, lost))}>
                <Search className="mr-1 h-4 w-4" /> Marcar como Perdido
              </Button>
            ) : (
              <Button size="sm" onClick={() => run(() => api.markFound(pet.id))}>
                <CheckCircle2 className="mr-1 h-4 w-4" /> Pet Encontrado
              </Button>
            )}
          </div>
          {(!pet.isLost) && (
            <Card>
              <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
                <Input placeholder="Cidade" value={lost.lostCity} onChange={(e) => setLost({ ...lost, lostCity: e.target.value })} />
                <Input placeholder="Contato" value={lost.lostContact} onChange={(e) => setLost({ ...lost, lostContact: e.target.value })} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="saude">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Stethoscope className="h-4 w-4" /> Prontuário Digital</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {pet.medicalRecords.length === 0 && <p className="text-sm text-ecopet-gray">Nenhum registro médico.</p>}
              {pet.medicalRecords.map((r) => (
                <div key={r.id} className="rounded-xl border border-ecopet-gray/10 p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <strong>{r.title}</strong>
                    <Badge variant="outline">{MEDICAL_TYPE_LABELS[r.type] ?? r.type}</Badge>
                  </div>
                  <p className="text-ecopet-gray">{new Date(r.recordDate).toLocaleDateString("pt-BR")} · {r.veterinarianName ?? "—"} · {r.clinicName ?? "—"}</p>
                  {r.content && <p className="mt-1">{r.content}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
          <SectionForm title="Novo registro médico" loading={loading} onSubmit={() => run(() => api.addMedicalRecord(pet.id, medical))}>
            <select className="flex h-11 w-full rounded-xl border px-3 text-sm" value={medical.type} onChange={(e) => setMedical({ ...medical, type: e.target.value })}>
              {Object.entries(MEDICAL_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <Input placeholder="Título" value={medical.title} onChange={(e) => setMedical({ ...medical, title: e.target.value })} />
            <Input type="date" value={medical.recordDate} onChange={(e) => setMedical({ ...medical, recordDate: e.target.value })} />
            <Input placeholder="Veterinário" value={medical.veterinarianName} onChange={(e) => setMedical({ ...medical, veterinarianName: e.target.value })} />
            <Input placeholder="Clínica" value={medical.clinicName} onChange={(e) => setMedical({ ...medical, clinicName: e.target.value })} />
            <Input placeholder="Observações" value={medical.content} onChange={(e) => setMedical({ ...medical, content: e.target.value })} />
            <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setMedical({ ...medical, title: medical.title || file.name, content: `${medical.content}\nAnexo: ${file.name}`.trim() });
            }} />
          </SectionForm>
        </TabsContent>

        <TabsContent value="vacinas">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Syringe className="h-4 w-4" /> Carteira de Vacinação</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pet.vaccinations.map((v) => (
                <div key={v.id} className="flex justify-between border-b border-ecopet-gray/10 pb-2 text-sm">
                  <div>
                    <p className="font-medium">{v.name}</p>
                    <p className="text-ecopet-gray">{v.manufacturer} · Lote {v.batch ?? "—"}</p>
                  </div>
                  <div className="text-right text-ecopet-gray">
                    <p>{new Date(v.date).toLocaleDateString("pt-BR")}</p>
                    {v.nextDue && <p className={cn(new Date(v.nextDue) < new Date() && "text-red-500")}>Próx: {new Date(v.nextDue).toLocaleDateString("pt-BR")}</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <SectionForm title="Registrar vacina" loading={loading} onSubmit={() => run(() => api.addVaccination(pet.id, vaccine))}>
            <select className="flex h-11 w-full rounded-xl border px-3 text-sm" value={vaccine.name} onChange={(e) => setVaccine({ ...vaccine, name: e.target.value })}>
              {VACCINE_PRESETS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <Input placeholder="Fabricante" value={vaccine.manufacturer} onChange={(e) => setVaccine({ ...vaccine, manufacturer: e.target.value })} />
            <Input placeholder="Lote" value={vaccine.batch} onChange={(e) => setVaccine({ ...vaccine, batch: e.target.value })} />
            <Input type="date" placeholder="Data aplicação" value={vaccine.date} onChange={(e) => setVaccine({ ...vaccine, date: e.target.value })} />
            <Input type="date" placeholder="Próxima dose" value={vaccine.nextDue} onChange={(e) => setVaccine({ ...vaccine, nextDue: e.target.value })} />
            <Input placeholder="Veterinário" value={vaccine.veterinarian} onChange={(e) => setVaccine({ ...vaccine, veterinarian: e.target.value })} />
          </SectionForm>
        </TabsContent>

        <TabsContent value="medicacoes">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Pill className="h-4 w-4" /> Medicações</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pet.medications.map((m) => (
                <div key={m.id} className="text-sm border-b border-ecopet-gray/10 pb-2">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-ecopet-gray">{m.dosage} · {m.frequency}</p>
                  {m.notes && <p className="text-xs">{m.notes}</p>}
                </div>
              ))}
              {(pet.medicationReminders?.length ?? 0) > 0 && (
                <div className="mt-2 rounded-lg bg-blue-50 p-2 text-xs dark:bg-blue-950/30">
                  <p className="font-medium">Lembretes ativos</p>
                  {pet.medicationReminders!.map((r) => <p key={r.name}>{r.message}</p>)}
                </div>
              )}
            </CardContent>
          </Card>
          <SectionForm title="Nova medicação" loading={loading} onSubmit={() => run(() => api.addMedication(pet.id, medication))}>
            <Input placeholder="Medicamento" value={medication.name} onChange={(e) => setMedication({ ...medication, name: e.target.value })} />
            <Input placeholder="Dosagem" value={medication.dosage} onChange={(e) => setMedication({ ...medication, dosage: e.target.value })} />
            <Input placeholder="Frequência" value={medication.frequency} onChange={(e) => setMedication({ ...medication, frequency: e.target.value })} />
            <Input type="date" value={medication.startDate} onChange={(e) => setMedication({ ...medication, startDate: e.target.value })} />
            <Input type="date" value={medication.endDate} onChange={(e) => setMedication({ ...medication, endDate: e.target.value })} />
            <Input placeholder="Observações" value={medication.notes} onChange={(e) => setMedication({ ...medication, notes: e.target.value })} />
          </SectionForm>
        </TabsContent>

        <TabsContent value="peso">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Scale className="h-4 w-4" /> Evolução de peso</CardTitle></CardHeader>
            <CardContent>
              <WeightChart records={pet.weightRecords} />
            </CardContent>
          </Card>
          <SectionForm title="Registrar peso" loading={loading} onSubmit={() => run(() => api.addWeight(pet.id, { weight: Number(weight.weight), notes: weight.notes }))}>
            <Input type="number" step="0.1" placeholder="Peso (kg)" value={weight.weight} onChange={(e) => setWeight({ ...weight, weight: e.target.value })} />
            <Input placeholder="Observação" value={weight.notes} onChange={(e) => setWeight({ ...weight, notes: e.target.value })} />
          </SectionForm>
        </TabsContent>

        <TabsContent value="fotos">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><ImageIcon className="h-4 w-4" /> Galeria</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {pet.media.map((m) => (
                  <div key={m.id} className="overflow-hidden rounded-xl border">
                    {m.type === "photo" ? (
                      <div className="relative aspect-square">
                        <Image src={m.url} alt={m.caption ?? ""} fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <video src={m.url} controls className="aspect-square w-full object-cover" />
                    )}
                    {m.caption && <p className="p-2 text-xs">{m.caption}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <SectionForm title="Adicionar mídia" loading={loading} onSubmit={() => run(() => api.addMedia(pet.id, media))}>
            <select className="flex h-11 w-full rounded-xl border px-3 text-sm" value={media.type} onChange={(e) => setMedia({ ...media, type: e.target.value as "photo" | "video" })}>
              <option value="photo">Foto</option>
              <option value="video">Vídeo</option>
            </select>
            <Input placeholder="URL da mídia" value={media.url} onChange={(e) => setMedia({ ...media, url: e.target.value })} />
            <Input placeholder="Legenda" value={media.caption} onChange={(e) => setMedia({ ...media, caption: e.target.value })} />
          </SectionForm>
        </TabsContent>

        <TabsContent value="adocao">
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm text-ecopet-gray">
                Status: {pet.availableForAdoption ? "Disponível para adoção" : "Não disponível"}
              </p>
              <Input placeholder="Motivo" value={adoption.adoptionReason} onChange={(e) => setAdoption({ ...adoption, adoptionReason: e.target.value })} />
              <Input placeholder="Requisitos" value={adoption.adoptionRequirements} onChange={(e) => setAdoption({ ...adoption, adoptionRequirements: e.target.value })} />
              <Input placeholder="Cidade" value={adoption.adoptionCity} onChange={(e) => setAdoption({ ...adoption, adoptionCity: e.target.value })} />
              <Input type="number" placeholder="Taxa de adoção (R$)" value={adoption.adoptionFee} onChange={(e) => setAdoption({ ...adoption, adoptionFee: e.target.value })} />
              <div className="flex gap-2">
                <Button size="sm" disabled={loading} onClick={() => run(() => api.setAdoption(pet.id, { ...adoption, availableForAdoption: true, adoptionFee: adoption.adoptionFee ? Number(adoption.adoptionFee) : undefined }))}>
                  <PawPrint className="mr-1 h-4 w-4" /> Disponível para adoção
                </Button>
                {pet.availableForAdoption && (
                  <Button size="sm" variant="outline" disabled={loading} onClick={() => run(() => api.setAdoption(pet.id, { availableForAdoption: false }))}>
                    Remover da adoção
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" /> Linha do tempo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {pet.events.map((ev) => (
                <div key={ev.id} className="relative border-l-2 border-ecopet-green/30 pl-4">
                  <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-ecopet-green" />
                  <p className="text-xs text-ecopet-gray">{new Date(ev.createdAt).toLocaleString("pt-BR")}</p>
                  <p className="font-medium">{ev.title}</p>
                  <p className="text-sm text-ecopet-gray">{EVENT_TYPE_LABELS[ev.eventType] ?? ev.eventType}{ev.description ? ` — ${ev.description}` : ""}</p>
                  {ev.createdBy && <p className="text-xs text-ecopet-gray">por {ev.createdBy.name}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
