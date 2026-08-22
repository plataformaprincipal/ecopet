import { cn } from "@/lib/utils";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function Chip({ className, selected, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-[36px] items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        selected
          ? "border-ecopet-green bg-ecopet-green text-white"
          : "border-[var(--ep-border)] bg-[var(--card)] text-[var(--ep-fg-muted)] hover:border-ecopet-green/40 hover:text-[var(--ep-fg)]",
        className
      )}
      aria-pressed={selected}
      {...props}
    >
      {children}
    </button>
  );
}
