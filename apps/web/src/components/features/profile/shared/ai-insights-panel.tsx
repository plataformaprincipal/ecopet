"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProfileInsight } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

interface AIInsightsPanelProps {
  insights: ProfileInsight[];
  title?: string;
  subtitle?: string;
}

const priorityStyles = {
  low: "border-ecopet-gray/20",
  medium: "border-ecopet-green/20",
  high: "border-amber-500/30 bg-amber-500/5",
};

export function AIInsightsPanel({ insights, title = "Central IA ECOPET", subtitle }: AIInsightsPanelProps) {
  return (
    <section className="rounded-2xl border border-ecopet-green/20 bg-gradient-to-br from-ecopet-green/5 via-transparent to-ecopet-yellow/5 p-4 lg:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Sparkles className="h-5 w-5 text-ecopet-yellow" />
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <Badge variant="premium">IA</Badge>
        {subtitle && <p className="w-full text-sm text-ecopet-gray">{subtitle}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((r) => (
          <div
            key={r.id}
            className={cn("rounded-xl border bg-white/80 p-4 dark:bg-white/5", priorityStyles[r.priority ?? "medium"])}
          >
            {r.tag && <Badge variant="default" className="mb-2 text-[10px]">{r.tag}</Badge>}
            <h3 className="font-semibold">{r.title}</h3>
            <p className="mt-1 text-sm text-ecopet-gray">{r.description}</p>
            {r.href && r.action && (
              <Link href={r.href} className="mt-3 inline-block">
                <Button size="sm" variant="outline">{r.action}</Button>
              </Link>
            )}
            {!r.href && r.action && (
              <Button size="sm" variant="outline" className="mt-3">{r.action}</Button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
