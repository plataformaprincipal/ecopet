import { cn } from "@/lib/utils";
import type { OngAccessLevel } from "@/lib/ong/access";
import { ongApprovalLabel } from "@/lib/ong/access";

type OngStatusBadgeProps = {
  accountStatus: string;
  verificationStatus?: string | null;
  accessLevel?: OngAccessLevel;
  className?: string;
};

const toneMap: Record<string, string> = {
  Aprovado:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  Pendente: "bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:text-amber-300",
  Recusado: "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300",
  Suspenso: "bg-zinc-500/10 text-zinc-700 ring-zinc-500/20 dark:text-zinc-300",
};

export function OngStatusBadge({
  accountStatus,
  verificationStatus,
  className,
}: OngStatusBadgeProps) {
  const label = ongApprovalLabel(
    accountStatus as "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED",
    verificationStatus
  );

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneMap[label] ?? toneMap.Pendente,
        className
      )}
    >
      {label}
    </span>
  );
}

type AnimalStatusBadgeProps = {
  label: string;
  variant?: "success" | "warning" | "muted" | "danger";
};

const animalTone: Record<NonNullable<AnimalStatusBadgeProps["variant"]>, string> = {
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
  muted: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
  danger: "bg-red-500/10 text-red-700 dark:text-red-300",
};

export function OngAnimalStatusBadge({ label, variant = "muted" }: AnimalStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        animalTone[variant]
      )}
    >
      {label}
    </span>
  );
}
