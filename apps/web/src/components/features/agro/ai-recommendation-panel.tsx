"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AiAgroRecommendation } from "@/lib/agro/types";

interface AIRecommendationPanelProps {
  recommendations: AiAgroRecommendation[];
  title?: string;
}

export function AIRecommendationPanel({ recommendations, title = "IA Agro Inteligente" }: AIRecommendationPanelProps) {
  return (
    <section className="rounded-2xl border border-ecopet-green/20 bg-gradient-to-br from-ecopet-green/5 to-transparent p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-ecopet-yellow" />
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <Badge variant="premium">ML + IoT</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {recommendations.map((r) => (
          <div key={r.id} className="rounded-xl border border-ecopet-green/10 bg-white/80 p-4 dark:bg-white/5">
            <Badge variant="default" className="mb-2 text-[10px]">{r.tag}</Badge>
            <h3 className="font-semibold">{r.title}</h3>
            <p className="mt-1 text-sm text-ecopet-gray">{r.description}</p>
            {r.href && r.action && (
              <Link href={r.href} className="mt-3 inline-block">
                <Button size="sm" variant="outline">{r.action}</Button>
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
