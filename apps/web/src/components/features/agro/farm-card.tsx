"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Cpu, Bot, Plane } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatHa } from "@/lib/agro/config";
import type { AgroFarm } from "@/lib/agro/types";

interface FarmCardProps {
  farm: AgroFarm;
  compact?: boolean;
}

export function FarmCard({ farm, compact }: FarmCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-ecopet-gray/10 bg-white shadow-sm transition-all hover:shadow-lg dark:bg-white/5">
      <div className="relative h-32 overflow-hidden">
        <Image src={farm.image} alt={farm.name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Badge className="absolute left-3 top-3 bg-ecopet-green text-white">{farm.productivityIndex}% eficiência</Badge>
      </div>
      <div className="p-4">
        <h3 className="font-semibold">{farm.name}</h3>
        <p className="flex items-center gap-1 text-xs text-ecopet-gray"><MapPin className="h-3 w-3" /> {farm.location}</p>
        {!compact && (
          <>
            <p className="mt-2 text-sm text-ecopet-gray">Proprietário: {farm.owner}</p>
            <p className="mt-1 text-lg font-bold text-ecopet-green">{formatHa(farm.totalAreaHa)}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-ecopet-gray">
              <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> {farm.sensorCount} sensores</span>
              <span className="flex items-center gap-1"><Bot className="h-3 w-3" /> {farm.robotCount} robôs</span>
              <span className="flex items-center gap-1"><Plane className="h-3 w-3" /> {farm.droneCount} drones</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {farm.crops.map((c) => <Badge key={c} variant="default">{c}</Badge>)}
            </div>
          </>
        )}
        <Link href={`/agro/fazendas?farm=${farm.id}`} className="mt-3 block">
          <Button size="sm" className="w-full">Ver detalhes</Button>
        </Link>
      </div>
    </article>
  );
}
