"use client";

import Image from "next/image";
import { formatMpPrice } from "@/lib/marketplace/config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SubscriptionPlan } from "@/lib/marketplace/types";

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
}

export function SubscriptionCard({ plan }: SubscriptionCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent">
      <div className="relative h-32 overflow-hidden">
        <Image src={plan.image} alt={plan.name} fill className="object-cover" />
        <Badge className="absolute left-3 top-3 bg-violet-600 text-white">Assinatura</Badge>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold">{plan.name}</h3>
        <p className="mt-1 text-xs text-ecopet-gray">{plan.description}</p>
        <p className="mt-2 text-lg font-bold text-ecopet-green">
          {formatMpPrice(plan.price)}
          <span className="text-xs font-normal text-ecopet-gray">/{plan.frequency.toLowerCase()}</span>
        </p>
        <ul className="mt-3 space-y-1 text-xs text-ecopet-gray">
          {plan.items.map((item) => (
            <li key={item}>✓ {item}</li>
          ))}
        </ul>
        <div className="mt-auto flex gap-2 pt-4">
          <Button size="sm" className="flex-1">Assinar</Button>
          <Button size="sm" variant="outline">Detalhes</Button>
        </div>
        <p className="mt-2 text-[10px] text-ecopet-gray">Pause, altere ou cancele quando quiser</p>
      </div>
    </article>
  );
}
