"use client";

import { useState } from "react";
import { FileText, CheckCircle2, Clock, MessageSquare, Handshake, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { cn } from "@/lib/utils";

const STATUS_STEPS = [
  { key: "awaiting", label: "Aguardando propostas", icon: Clock },
  { key: "proposals", label: "Proposta recebida", icon: MessageSquare },
  { key: "negotiating", label: "Em negociação", icon: Handshake },
  { key: "hired", label: "Contratado", icon: CheckCircle2 },
  { key: "completed", label: "Concluído", icon: Trophy },
] as const;

export function CustomServiceForm() {
  const { submitCustomRequest, customRequests } = useMarketplaceStore();
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    petName: "",
    species: "Cão",
    size: "Médio",
    age: "",
    need: "",
    description: "",
    location: "",
    urgency: "Média",
    desiredDate: "",
    desiredTime: "",
    budget: "",
    acceptProposals: true,
    notes: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = submitCustomRequest({
      petName: form.petName,
      species: form.species,
      size: form.size,
      age: form.age,
      need: form.need,
      description: form.description,
      location: form.location,
      urgency: form.urgency,
      desiredDate: form.desiredDate,
      desiredTime: form.desiredTime,
      budget: form.budget ? parseFloat(form.budget) : undefined,
      acceptProposals: form.acceptProposals,
      notes: form.notes,
    });
    setSubmittedId(id);
  }

  const latest = submittedId ? customRequests.find((r) => r.id === submittedId) : null;

  if (latest) {
    const currentIdx = STATUS_STEPS.findIndex((s) => s.key === latest.status);
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="border-ecopet-green/30 bg-ecopet-green/5">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-ecopet-green" />
            <h2 className="mt-4 font-display text-xl font-bold">Solicitação enviada!</h2>
            <p className="mt-2 text-sm text-ecopet-gray">
              Sua demanda foi enviada para parceiros verificados. Você receberá propostas em breve.
            </p>
            <Badge className="mt-4">ID: {latest.id}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status da solicitação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {STATUS_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const active = idx <= currentIdx;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      active ? "bg-ecopet-green text-white" : "bg-ecopet-gray/10 text-ecopet-gray"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={cn("text-sm font-semibold", active && "text-ecopet-green")}>{step.label}</p>
                      {idx === currentIdx && (
                        <p className="text-xs text-ecopet-gray">Status atual — aguardando respostas dos parceiros</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={() => setSubmittedId(null)}>Nova solicitação</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-ecopet-green" />
            Solicitar serviço personalizado
          </CardTitle>
          <p className="text-sm text-ecopet-gray">
            Descreva sua necessidade sob medida. Parceiros enviarão propostas personalizadas.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Nome do pet</label>
                <Input value={form.petName} onChange={(e) => setForm({ ...form, petName: e.target.value })} placeholder="Ex: Luna" required />
              </div>
              <div>
                <label className="text-sm font-medium">Espécie</label>
                <select className="mt-1 flex h-11 w-full rounded-xl border px-4 text-sm" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}>
                  <option>Cão</option><option>Gato</option><option>Ave</option><option>Outro</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Porte</label>
                <select className="mt-1 flex h-11 w-full rounded-xl border px-4 text-sm" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
                  <option>Mini</option><option>Pequeno</option><option>Médio</option><option>Grande</option><option>Gigante</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Idade</label>
                <Input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Ex: 3 anos" />
              </div>
              <div>
                <label className="text-sm font-medium">Urgência</label>
                <select className="mt-1 flex h-11 w-full rounded-xl border px-4 text-sm" value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
                  <option>Baixa</option><option>Média</option><option>Alta</option><option>Emergência</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Necessidade *</label>
              <Input value={form.need} onChange={(e) => setForm({ ...form, need: e.target.value })} placeholder="Ex: Transporte + consulta" required />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição detalhada *</label>
              <textarea
                className="mt-1 flex min-h-[100px] w-full rounded-xl border border-ecopet-gray/20 px-4 py-3 text-sm focus:border-ecopet-green focus:outline-none dark:bg-white/5"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                minLength={10}
                placeholder="Descreva com detalhes o que precisa..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Localização</label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Bairro, cidade" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Data desejada</label>
                <Input type="date" value={form.desiredDate} onChange={(e) => setForm({ ...form, desiredDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Horário desejado</label>
                <Input type="time" value={form.desiredTime} onChange={(e) => setForm({ ...form, desiredTime: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Orçamento estimado (R$)</label>
              <Input type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="Opcional" />
            </div>
            <div>
              <label className="text-sm font-medium">Anexar imagem/documento</label>
              <Input type="file" accept="image/*,.pdf" className="mt-1" />
              <p className="mt-1 text-xs text-ecopet-gray">Mock: upload simulado nesta etapa</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.acceptProposals} onChange={(e) => setForm({ ...form, acceptProposals: e.target.checked })} className="accent-ecopet-green" />
              Aceitar receber propostas de parceiros
            </label>
            <div>
              <label className="text-sm font-medium">Observações</label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Informações adicionais" />
            </div>
            <Button type="submit" className="w-full" size="lg">Enviar solicitação</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
