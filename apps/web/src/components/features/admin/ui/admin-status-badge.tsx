import { cn } from "@/lib/utils";

const VARIANTS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  OPEN: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  ERROR: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  NOT_CONFIGURED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  INATIVO: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export function AdminStatusBadge({ status, className }: { status: string; className?: string }) {
  const key = status.toUpperCase().replace(/\s/g, "_");
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANTS[key] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {status}
    </span>
  );
}
