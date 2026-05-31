"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Edit, Pause, Play, Copy, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatMpPrice } from "@/lib/marketplace/config";
import { MOCK_SERVICES } from "@/lib/marketplace/mock-data";
import type { MarketplaceService } from "@/lib/marketplace/types";

export function PartnerServiceManager() {
  const [services, setServices] = useState(MOCK_SERVICES.slice(0, 6));
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">Gestão de Serviços</h3>
          <p className="text-sm text-ecopet-gray">Agenda, modalidade, equipe e disponibilidade</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /> Cadastrar serviço</Button>
      </div>

      {showForm && <ServiceForm onClose={() => setShowForm(false)} />}

      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((s) => (
          <ServiceManageCard key={s.id} service={s} />
        ))}
      </div>
    </div>
  );
}

function ServiceManageCard({ service }: { service: MarketplaceService }) {
  const modalities = [
    service.inPerson && "Presencial",
    service.homeService && "Domiciliar",
    service.telehealth && "Online",
  ].filter(Boolean);

  return (
    <article className="card-premium rounded-[16px] border border-ecopet-gray/10 p-4">
      <div className="flex gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
          <Image src={service.image} alt="" fill className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold">{service.name}</h4>
          <p className="text-sm text-ecopet-gray">{service.category}</p>
          <p className="mt-1 font-bold text-ecopet-green">{formatMpPrice(service.price)} · {service.durationMin} min</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {modalities.map((m) => <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>)}
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-1 border-t border-ecopet-gray/10 pt-3">
        <Button size="sm" variant="outline"><Edit className="h-3.5 w-3.5" /> Editar</Button>
        <Button size="sm" variant="ghost"><Pause className="h-3.5 w-3.5" /> Pausar</Button>
        <Button size="sm" variant="ghost"><Copy className="h-3.5 w-3.5" /></Button>
        <Button size="sm" variant="ghost" className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </article>
  );
}

function ServiceForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="card-premium space-y-4 rounded-[16px] border border-ecopet-green/20 p-4 lg:p-6">
      <div className="flex items-center gap-2">
        <Wrench className="h-5 w-5 text-ecopet-green" />
        <h4 className="font-semibold">Novo serviço</h4>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {["Nome", "Categoria", "Preço inicial", "Duração (min)", "Local", "Equipe"].map((label) => (
          <div key={label}>
            <label className="mb-1 block text-xs font-medium text-ecopet-gray">{label}</label>
            <Input placeholder={label} />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        {["Presencial", "Domiciliar", "Online"].map((m) => (
          <label key={m} className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="accent-ecopet-green" /> {m}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <Button>Salvar serviço</Button>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
      </div>
    </div>
  );
}
