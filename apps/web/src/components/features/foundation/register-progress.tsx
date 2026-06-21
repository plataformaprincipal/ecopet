"use client";

import { cn } from "@/lib/utils";

type RegisterStep = "personal" | "security" | "conclusion";

const DEFAULT_STEPS: { id: RegisterStep; label: string }[] = [
  { id: "personal", label: "Dados pessoais" },
  { id: "security", label: "Segurança" },
  { id: "conclusion", label: "Conclusão" },
];

type RegisterProgressProps =
  | { current: RegisterStep; steps?: never; currentIndex?: never }
  | { steps: string[]; currentIndex: number; current?: never };

export function RegisterProgress(props: RegisterProgressProps) {
  const labels = "steps" in props && props.steps ? props.steps : DEFAULT_STEPS.map((s) => s.label);
  const currentIndex =
    "currentIndex" in props && props.steps
      ? props.currentIndex
      : DEFAULT_STEPS.findIndex((s) => s.id === props.current);

  return (
    <nav aria-label="Progresso do cadastro" className="mb-6">
      <ol className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
        {labels.map((label, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex;
          return (
            <li key={`${label}-${index}`} className="flex min-w-[4.5rem] flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
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
                  "text-center text-[10px] font-medium leading-tight sm:text-xs",
                  isActive || isComplete ? "text-green-800" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-green-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / labels.length) * 100}%` }}
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={labels.length}
        />
      </div>
    </nav>
  );
}
