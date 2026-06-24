"use client";

type FilterPanelProps = {
  children: React.ReactNode;
  className?: string;
};

export function FilterPanel({ children, className = "" }: FilterPanelProps) {
  return (
    <aside
      className={`hidden rounded-[20px] border border-zinc-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/60 lg:block ${className}`}
      aria-label="Filtros"
    >
      <h2 className="mb-4 font-semibold text-zinc-900 dark:text-white">Filtros</h2>
      {children}
    </aside>
  );
}

export function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-4 block text-sm last:mb-0">
      <span className="mb-1.5 block font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

export const filterInputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-zinc-950";
