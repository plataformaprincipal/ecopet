"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { EcoPetLogo } from "@/components/brand/ecopet-logo";
import { Button } from "@/components/ui/button";
import { PawPrint, Sparkles, ShoppingBag } from "lucide-react";

const steps = [
  { icon: PawPrint, title: "Cadastre seus pets", desc: "Prontuário, vacinas e evolução em um só lugar." },
  { icon: Sparkles, title: "Conheça a IA ECOPET", desc: "Triagem, nutrição e lembretes inteligentes." },
  { icon: ShoppingBag, title: "Explore o marketplace", desc: "Produtos e serviços com entrega e avaliações." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-ecopet-dark to-ecopet-green p-6">
      <EcoPetLogo className="mb-12" variant="dark" size="lg" showText />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          className="max-w-md text-center text-white"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10">
            {(() => {
              const Icon = steps[step].icon;
              return <Icon className="h-10 w-10 text-ecopet-yellow" />;
            })()}
          </div>
          <h1 className="mt-8 font-display text-3xl font-bold">{steps[step].title}</h1>
          <p className="mt-4 text-white/80">{steps[step].desc}</p>
        </motion.div>
      </AnimatePresence>
      <div className="mt-8 flex gap-2">
        {steps.map((_, i) => (
          <div key={i} className={`h-2 w-2 rounded-full ${i === step ? "bg-ecopet-yellow" : "bg-white/30"}`} />
        ))}
      </div>
      <Button
        variant="secondary"
        size="lg"
        className="mt-12"
        onClick={() => (step < steps.length - 1 ? setStep(step + 1) : router.push("/dashboard"))}
      >
        {step < steps.length - 1 ? "Próximo" : "Começar"}
      </Button>
    </div>
  );
}
