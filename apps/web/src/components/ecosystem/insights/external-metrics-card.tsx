"use client";

import { Instagram, MessageCircle, Globe, ShoppingBag, Link2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SOURCE_ICONS = {
  instagram: Instagram,
  whatsapp: MessageCircle,
  google: Globe,
  marketplace: ShoppingBag,
};

interface ExternalMetricsCardProps {
  source: "instagram" | "whatsapp" | "google" | "marketplace";
  name: string;
  connected: boolean;
  lastSync?: string;
  metrics: { label: string; value: string }[];
}

export function ExternalMetricsCard({ source, name, connected, lastSync, metrics }: ExternalMetricsCardProps) {
  const Icon = SOURCE_ICONS[source];

  return (
    <article className={cn(
      "card-premium rounded-[16px] border p-4",
      connected ? "border-ecopet-green/20" : "border-ecopet-gray/10 opacity-80"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ecopet-green/10">
            <Icon className="h-5 w-5 text-ecopet-green" />
          </div>
          <div>
            <h4 className="font-semibold">{name}</h4>
            <Badge variant={connected ? "verified" : "secondary"} className="text-[10px]">
              {connected ? "Conectado" : "Desconectado"}
            </Badge>
          </div>
        </div>
        {connected ? (
          <Button size="sm" variant="ghost"><Settings className="h-4 w-4" /></Button>
        ) : (
          <Button size="sm" variant="outline"><Link2 className="h-4 w-4" /> Conectar</Button>
        )}
      </div>

      {connected && lastSync && (
        <p className="mt-2 text-[10px] text-ecopet-gray">Última sync: {lastSync}</p>
      )}

      {connected && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-lg bg-ecopet-gray/5 p-2 text-center dark:bg-white/5">
              <p className="font-display text-lg font-bold">{m.value}</p>
              <p className="text-[10px] text-ecopet-gray">{m.label}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
