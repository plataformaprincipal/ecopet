"use client";

import { useState } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { AIToolCard } from "../ai-tool-card";
import { LoginRequiredModal } from "../login-required-modal";
import { ECCOPET_AI_DISCLAIMER, ECCOPET_TOOLS } from "@/lib/public/eccopet-tools";
import { useAuthGate } from "@/providers/auth-gate-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function PublicEccoPetPage() {
  const { isAuthenticated, requireAuth } = useAuthGate();
  const [demoTool, setDemoTool] = useState<(typeof ECCOPET_TOOLS)[number] | null>(null);
  const [fullModal, setFullModal] = useState(false);

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-ecopet-dark via-emerald-900 to-ecopet-green p-8 text-white sm:p-12">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-ecopet-yellow/20 blur-3xl" aria-hidden />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-ecopet-yellow" aria-hidden />
            EccoPet · IA
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
            Inteligência para cuidar melhor do seu pet
          </h1>
          <p className="mt-3 max-w-2xl text-white/80">
            Ferramentas inteligentes para rotina, alimentação, adoção e organização — com transparência e responsabilidade.
          </p>
        </div>
      </header>

      <div
        className="flex items-start gap-3 rounded-[20px] border border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-500/20 dark:bg-amber-950/30"
        role="note"
      >
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{ECCOPET_AI_DISCLAIMER}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ECCOPET_TOOLS.map((tool) => (
          <AIToolCard
            key={tool.id}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            status={tool.status}
            onTry={() => setDemoTool(tool)}
            onFullUse={() => {
              if (!requireAuth()) setFullModal(true);
            }}
          />
        ))}
      </div>

      <Dialog open={Boolean(demoTool)} onOpenChange={(o) => !o && setDemoTool(null)}>
        <DialogContent className="rounded-[20px]">
          <DialogHeader>
            <DialogTitle>{demoTool?.title} — demonstração</DialogTitle>
            <DialogDescription>{ECCOPET_AI_DISCLAIMER}</DialogDescription>
          </DialogHeader>
          {demoTool?.demoPrompt ? (
            <div className="space-y-3 text-sm">
              <p className="rounded-xl bg-ecopet-green/10 p-3 font-medium text-ecopet-dark dark:text-white">
                {demoTool.demoPrompt}
              </p>
              <p className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-800">{demoTool.demoReply}</p>
            </div>
          ) : null}
          <Button
            className="rounded-xl"
            onClick={() => {
              setDemoTool(null);
              if (!isAuthenticated) setFullModal(true);
            }}
          >
            Salvar resultado / usar completo
          </Button>
        </DialogContent>
      </Dialog>

      <LoginRequiredModal open={fullModal} onOpenChange={setFullModal} />
    </div>
  );
}
