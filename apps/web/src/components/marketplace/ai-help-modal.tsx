"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Sparkles, Calendar, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { MOCK_AI_RECOMMENDATIONS } from "@/lib/marketplace/mock-data";
import { MP_IMAGES } from "@/lib/marketplace/config";
import { cn } from "@/lib/utils";

const QUICK_OPTIONS = [
  "Ração para meu pet",
  "Banho e tosa perto de mim",
  "Veterinário de emergência",
  "Combo mensal econômico",
  "Serviço personalizado",
];

export function AiHelpModal() {
  const { aiModalOpen, setAiModalOpen } = useMarketplaceStore();
  const [step, setStep] = useState<"ask" | "result">("ask");
  const [selected, setSelected] = useState("");
  const rec = MOCK_AI_RECOMMENDATIONS[0];

  function handleSelect(option: string) {
    setSelected(option);
    setStep("result");
  }

  function close() {
    setAiModalOpen(false);
    setTimeout(() => {
      setStep("ask");
      setSelected("");
    }, 300);
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity",
          aiModalOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={close}
      />
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl transition-all dark:bg-[#0f1419]",
          aiModalOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-ecopet-yellow" />
            <h2 className="font-display text-lg font-bold">IA ECOPET recomenda</h2>
          </div>
          <Button size="icon" variant="ghost" onClick={close}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {step === "ask" ? (
          <>
            <p className="text-sm text-ecopet-gray">O que você está procurando hoje?</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className="rounded-full border border-ecopet-green/30 px-4 py-2 text-sm font-medium transition-colors hover:bg-ecopet-green/10"
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-ecopet-gray">
              Com base no perfil da Luna (Golden, adulta, Vila Mariana) e em &quot;{selected}&quot;:
            </p>
            <div className="mt-4 rounded-xl border border-ecopet-green/20 bg-ecopet-green/5 p-4">
              <Badge variant="premium" className="mb-2">Melhor para seu pet</Badge>
              <div className="flex gap-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                  <Image src={rec.image ?? MP_IMAGES.food} alt="" fill className="object-cover" />
                </div>
                <div>
                  <p className="font-semibold">{rec.title}</p>
                  <p className="text-sm text-ecopet-gray">{rec.subtitle}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link href={rec.href} className="flex-1" onClick={close}>
                <Button className="w-full">
                  {rec.itemType === "service" ? (
                    <><Calendar className="h-4 w-4" /> Agendar serviço</>
                  ) : (
                    <><ShoppingBag className="h-4 w-4" /> Ver produto</>
                  )}
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setStep("ask")}>Outra opção</Button>
            </div>
          </>
        )}

        <p className="mt-4 text-[10px] text-ecopet-gray">
          A IA ECOPET não substitui um veterinário. Em emergências, procure atendimento profissional.
        </p>
      </div>
    </>
  );
}
