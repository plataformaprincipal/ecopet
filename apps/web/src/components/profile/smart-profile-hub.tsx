"use client";

import { useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { ProfileHeader } from "./profile-header";
import { PersonaTabs } from "./shared/persona-tabs";
import { ProfileLoadingSkeleton } from "./shared/realtime-indicators";
import { useCurrentUser } from "@/hooks/use-current-user";
import { resolveProfile } from "@/lib/profile/role-mapper";
import type { ProfileCategory } from "@/lib/profile/types";
import { renderClientModule } from "./client/client-modules";
import { renderPartnerModule } from "./partner/partner-modules";
import { renderNGOModule } from "./ngo/ngo-modules";

function renderModule(category: ProfileCategory, moduleId: string) {
  switch (category) {
    case "CLIENT": return renderClientModule(moduleId);
    case "PARTNER": return renderPartnerModule(moduleId);
    case "NGO": return renderNGOModule(moduleId);
    default: return null;
  }
}

export function SmartProfileHub() {
  const searchParams = useSearchParams();
  const { user, loading } = useCurrentUser();

  const profile = useMemo(
    () => resolveProfile({
      role: user?.role,
      category: searchParams.get("category"),
      subtype: searchParams.get("subtype"),
    }),
    [user?.role, searchParams]
  );

  const [activeModule, setActiveModule] = useState("overview");

  useEffect(() => {
    setActiveModule(profile.modules[0]?.id ?? "overview");
  }, [profile.category, profile.partnerSubtype, profile.modules]);

  const activeModuleData = profile.modules.find((m) => m.id === activeModule) ?? profile.modules[0];

  return (
    <>
      <AppHeader title="Perfil" />
      <main className="mx-auto max-w-7xl flex-1 p-4 lg:p-6">
        {loading ? (
          <ProfileLoadingSkeleton />
        ) : (
          <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-6">
            <aside className="hidden lg:block">
              <PersonaTabs
                modules={profile.modules}
                activeId={activeModule}
                onChange={setActiveModule}
              />
            </aside>

            <div className="min-w-0 space-y-6">
              <ProfileHeader profile={profile} />

              <PersonaTabs
                modules={profile.modules}
                activeId={activeModule}
                onChange={setActiveModule}
                className="lg:hidden"
              />

              {activeModuleData && (
                <div className="transition-opacity duration-300">
                  <div className="mb-4 flex items-center gap-2">
                    <activeModuleData.icon className="h-5 w-5 text-ecopet-green" />
                    <h2 className="font-display text-xl font-bold">{activeModuleData.label}</h2>
                    {activeModuleData.badge && (
                      <span className="rounded-full bg-ecopet-yellow/20 px-2 py-0.5 text-xs font-semibold">{activeModuleData.badge}</span>
                    )}
                  </div>
                  {renderModule(profile.category, activeModule)}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
