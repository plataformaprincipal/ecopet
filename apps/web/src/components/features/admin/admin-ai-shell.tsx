"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const AI_ADMIN_NAV = [
  { href: "/admin/ai", label: "Dashboard", exact: true },
  { href: "/admin/ai/agents", label: "Agentes" },
  { href: "/admin/ai/prompts", label: "Prompts" },
  { href: "/admin/ai/models", label: "Modelos" },
  { href: "/admin/ai/providers", label: "Providers" },
  { href: "/admin/ai/conversations", label: "Conversas" },
  { href: "/admin/ai/costs", label: "Custos" },
  { href: "/admin/ai/logs", label: "Logs" },
  { href: "/admin/ai/feedbacks", label: "Feedbacks" },
  { href: "/admin/ai/tools", label: "Ferramentas" },
] as const;

export function AdminAiShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b bg-white px-6 py-4 dark:bg-gray-950">
        <h1 className="font-display text-xl font-bold">Plataforma AI-First</h1>
        <p className="text-sm text-muted-foreground">
          Infraestrutura desacoplada — pronta para OpenAI, Claude e Gemini.
        </p>
        <nav className="mt-4 flex flex-wrap gap-1" aria-label="Navegação IA">
          {AI_ADMIN_NAV.map((item) => {
            const active =
              "exact" in item && item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active ? "bg-ecopet-green/10 font-medium text-ecopet-green" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
