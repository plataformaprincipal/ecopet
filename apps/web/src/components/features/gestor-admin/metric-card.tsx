export { AnalyticsCards as MetricGrid } from "@/components/features/profile/shared/analytics-cards";

type Props = { label: string; value: string | number; variant?: "default" | "success" | "warning" | "critical" };

export function MetricCard({ label, value, variant = "default" }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-white/5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
