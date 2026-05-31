"use client";

import { cn } from "@/lib/utils";
import { INTEGRATION_STATUS_LABELS, ROBOT_STATUS_LABELS } from "@/lib/integrations/config";
import type { IntegrationStatus, RobotStatus } from "@/lib/integrations/types";

interface StatusBadgeProps {
  status: IntegrationStatus | RobotStatus;
  className?: string;
}

const styles: Record<string, string> = {
  connected: "bg-ecopet-green/10 text-ecopet-green",
  active: "bg-ecopet-green/10 text-ecopet-green",
  disconnected: "bg-ecopet-gray/10 text-ecopet-gray",
  paused: "bg-ecopet-gray/10 text-ecopet-gray",
  pending: "bg-amber-500/10 text-amber-600",
  awaiting_config: "bg-blue-500/10 text-blue-600",
  error: "bg-red-500/10 text-red-600",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = INTEGRATION_STATUS_LABELS[status] ?? ROBOT_STATUS_LABELS[status] ?? status;
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", styles[status] ?? styles.disconnected, className)}>
      {label}
    </span>
  );
}
