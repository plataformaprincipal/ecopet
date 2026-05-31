"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AiSuggestion } from "@/lib/social/types";
import { MOCK_AI_SUGGESTIONS } from "@/lib/social/mock-data";

interface AiSuggestionsBlockProps {
  suggestions?: AiSuggestion[];
}

export function AiSuggestionsBlock({ suggestions = MOCK_AI_SUGGESTIONS }: AiSuggestionsBlockProps) {
  return (
    <Card className="overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-ecopet-green/5">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 border-b border-violet-500/10 px-4 py-3">
          <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          <h2 className="font-display text-sm font-bold text-ecopet-dark dark:text-white">
            Sugestões Inteligentes
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto p-4 scrollbar-none">
          {suggestions.slice(0, 6).map((s) => (
            <Link
              key={s.id}
              href={s.href}
              className="flex w-36 shrink-0 flex-col overflow-hidden rounded-xl border border-ecopet-gray/10 bg-white shadow-sm transition hover:shadow-md dark:bg-white/5"
            >
              {s.image && (
                <div className="relative h-24 w-full">
                  <Image src={s.image} alt="" fill className="object-cover" />
                </div>
              )}
              <div className="p-2.5">
                <p className="line-clamp-1 text-xs font-bold text-ecopet-dark dark:text-white">{s.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[10px] text-ecopet-gray">{s.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface AiCommunityBlockProps {
  insights?: { id: string; text: string }[];
}

export function AiCommunityBlock({ insights }: AiCommunityBlockProps) {
  const items = insights ?? [
    { id: "1", text: "Seu pet pode gostar desse conteúdo sobre passeios matinais" },
    { id: "2", text: "Tendência entre Golden Retrievers: truques de obediência" },
    { id: "3", text: "Veterinários recomendam hidratação extra nesta semana" },
  ];

  return (
    <Card className="border-ecopet-green/20 bg-ecopet-green/[0.03]">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ecopet-dark dark:text-white">
            <Sparkles className="h-4 w-4 text-ecopet-green" />
            IA da Comunidade
          </h2>
          <Link href="/ia" className="flex items-center text-xs text-ecopet-green hover:underline">
            Ver mais <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg bg-white/80 px-3 py-2 text-xs text-ecopet-gray dark:bg-white/5 dark:text-white/80"
            >
              {item.text}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
