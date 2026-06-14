"use client";

import { cn } from "@/lib/utils";
import type { ProfileModule } from "@/lib/profile/types";

interface PersonaTabsProps {
  modules: ProfileModule[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function PersonaTabs({ modules, activeId, onChange, className }: PersonaTabsProps) {
  const groups = modules.reduce<Record<string, ProfileModule[]>>((acc, m) => {
    const g = m.group ?? "Geral";
    (acc[g] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mobile: scroll horizontal */}
      <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden scrollbar-hide">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                activeId === m.id
                  ? "bg-ecopet-green text-white shadow-md"
                  : "bg-ecopet-gray/10 text-ecopet-gray hover:bg-ecopet-gray/20"
              )}
            >
              <Icon className="h-4 w-4" />
              {m.label}
              {m.badge && (
                <span className="rounded-full bg-ecopet-yellow/30 px-1.5 text-[10px]">{m.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop: sidebar por grupos */}
      <nav className="hidden lg:block">
        {Object.entries(groups).map(([group, mods]) => (
          <div key={group} className="mb-4">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-ecopet-gray">{group}</p>
            <div className="space-y-0.5">
              {mods.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onChange(m.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all",
                      activeId === m.id
                        ? "bg-ecopet-green text-white shadow-sm"
                        : "text-ecopet-gray hover:bg-ecopet-gray/10 hover:text-ecopet-dark"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{m.label}</span>
                    {m.badge && (
                      <span className={cn(
                        "rounded-full px-1.5 text-[10px]",
                        activeId === m.id ? "bg-white/20" : "bg-ecopet-yellow/20 text-ecopet-dark"
                      )}>
                        {m.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
