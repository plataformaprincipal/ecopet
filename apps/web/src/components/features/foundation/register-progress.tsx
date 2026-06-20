"use client";

import { cn } from "@/lib/utils";

type RegisterStep = "personal" | "security" | "conclusion";

const STEPS: { id: RegisterStep; label: string }[] = [
  { id: "personal", label: "Dados pessoais" },
  { id: "security", label: "Segurança" },
  { id: "conclusion", label: "Conclusão" },
];

export function RegisterProgress({ current }: { current: RegisterStep }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Progresso do cadastro" className="mb-6">
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex;
          return (
            <li key={step.id} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isComplete && "bg-green-600 text-white",
                  isActive && "bg-green-700 text-white ring-2 ring-green-300 ring-offset-2",
                  !isComplete && !isActive && "bg-muted text-muted-foreground"
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isComplete ? "✓" : index + 1}
              </div>
              <span
                className={cn(
                  "text-center text-xs font-medium",
                  isActive || isComplete ? "text-green-800" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-green-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / STEPS.length) * 100}%` }}
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
        />
      </div>
    </nav>
  );
}
