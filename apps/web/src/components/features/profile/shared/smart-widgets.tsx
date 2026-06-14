"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { WidgetItem } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

interface SmartWidgetsProps {
  widgets: WidgetItem[];
  columns?: 2 | 3;
}

export function SmartWidgets({ widgets, columns = 2 }: SmartWidgetsProps) {
  return (
    <div className={cn("grid gap-3", columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3")}>
      {widgets.map((w) => {
        const inner = (
          <div className="rounded-xl border border-ecopet-gray/10 bg-white p-4 transition-all hover:shadow-md dark:bg-white/5">
            <p className="text-xs font-medium text-ecopet-gray">{w.label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{w.value}</p>
            {w.sublabel && <p className="text-xs text-ecopet-gray">{w.sublabel}</p>}
            {w.trend && <p className="mt-1 text-xs text-ecopet-green">{w.trend}</p>}
          </div>
        );
        return w.href ? (
          <Link key={w.id} href={w.href} className="block">{inner}</Link>
        ) : (
          <div key={w.id}>{inner}</div>
        );
      })}
    </div>
  );
}

interface ProfileSectionProps {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}

export function ProfileSection({ title, description, action, children }: ProfileSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
          {description && <p className="text-sm text-ecopet-gray">{description}</p>}
        </div>
        {action && (
          <Link href={action.href} className="flex items-center gap-1 text-sm font-medium text-ecopet-green">
            {action.label} <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

interface ProfileListProps {
  items: { label: string; value: string; href?: string; badge?: string }[];
}

export function ProfileList({ items }: ProfileListProps) {
  return (
    <div className="divide-y divide-ecopet-gray/10 rounded-2xl border border-ecopet-gray/10 bg-white dark:bg-white/5">
      {items.map((item) => {
        const row = (
          <div className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-ecopet-gray/5">
            <span className="text-sm text-ecopet-gray">{item.label}</span>
            <div className="flex items-center gap-2">
              {item.badge && (
                <span className="rounded-full bg-ecopet-green/10 px-2 py-0.5 text-[10px] font-semibold text-ecopet-green">
                  {item.badge}
                </span>
              )}
              <span className="text-sm font-medium">{item.value}</span>
              {item.href && <ChevronRight className="h-4 w-4 text-ecopet-gray" />}
            </div>
          </div>
        );
        return item.href ? (
          <Link key={item.label} href={item.href}>{row}</Link>
        ) : (
          <div key={item.label}>{row}</div>
        );
      })}
    </div>
  );
}
