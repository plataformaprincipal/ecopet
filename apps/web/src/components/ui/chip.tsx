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
          : "border-ecopet-gray/20 bg-white text-ecopet-gray hover:border-ecopet-green/40 hover:text-ecopet-dark dark:bg-white/5 dark:text-white/80",
        className
      )}
      aria-pressed={selected}
      {...props}
    >
      {children}
    </button>
  );
}
