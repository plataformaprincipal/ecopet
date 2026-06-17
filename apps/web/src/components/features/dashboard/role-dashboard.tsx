"use client";

import Link from "next/link";
import { Clock, LayoutDashboard } from "lucide-react";
import { AppHeader } from "@/components/layouts/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";

interface RoleDashboardProps {
  title: string;
  description: string;
  actions?: { href: string; label: string }[];
}

export function RoleDashboard({ title, description, actions = [] }: RoleDashboardProps) {
  const { user, loading } = useCurrentUser();
  return (
    <>
      <AppHeader title={title} />
      <main className="flex-1 p-4 lg:p-8">
        {loading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-ecopet-gray/10" />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-ecopet-green" />
                  {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-ecopet-gray">
                  Olá, <strong>{user?.name}</strong> — painel configurado para sua persona na ECOPET.
                </p>
                {actions.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {actions.map((a) => (
                      <Button key={a.href} asChild variant="outline">
                        <Link href={a.href}>{a.label}</Link>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </>
  );
}
