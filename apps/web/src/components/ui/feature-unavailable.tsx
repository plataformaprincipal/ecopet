"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureUnavailableProps {
  message?: string;
  className?: string;
  compact?: boolean;
}

export const FEATURE_UNAVAILABLE_DEFAULT =
  "Funcionalidade em preparação para a próxima versão.";

export const FEATURE_TEST_PHASE =
  "Este recurso ainda não está disponível nesta fase de testes.";

export const AI_STRUCTURAL_NOTICE =
  "Automação estrutural disponível. IA real será ativada após configuração da API.";

export const PAYMENT_HOMOLOG_NOTICE =
  "Pagamento real será ativado na fase de homologação financeira.";

export function FeatureUnavailable({
  message = FEATURE_UNAVAILABLE_DEFAULT,
  className,
  compact,
}: FeatureUnavailableProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-100",
        compact ? "p-2 text-xs" : "p-3 text-sm",
        className
      )}
    >
      <AlertCircle className={cn("shrink-0", compact ? "h-3.5 w-3.5 mt-0.5" : "h-4 w-4 mt-0.5")} aria-hidden />
      <p>{message}</p>
    </div>
  );
}
