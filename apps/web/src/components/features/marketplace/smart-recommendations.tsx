"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AI_TAG_LABELS } from "@/lib/marketplace/config";
import type { AiRecommendation } from "@/lib/marketplace/types";

interface SmartRecommendationsProps {
  recommendations: AiRecommendation[];
  title?: string;
}

export function SmartRecommendations({ recommendations, title = "Recomendados pela IA" }: SmartRecommendationsProps) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-ecopet-yellow" />
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <Badge variant="premium">IA ECOPET</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((rec) => (
          <Link
            key={rec.id}
            href={rec.href}
            className="group flex gap-3 rounded-2xl border border-ecopet-green/20 bg-gradient-to-br from-ecopet-green/5 to-transparent p-4 transition-all hover:border-ecopet-green/40 hover:shadow-md"
          >
            {rec.image && (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                <Image src={rec.image} alt="" fill className="object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <Badge variant="premium" className="mb-1 text-[10px]">
                {AI_TAG_LABELS[rec.tag]}
              </Badge>
              <p className="line-clamp-1 text-sm font-semibold group-hover:text-ecopet-green">{rec.title}</p>
              <p className="line-clamp-2 text-xs text-ecopet-gray">{rec.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
