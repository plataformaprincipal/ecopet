"use client";

import { useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { ProfileHeader } from "./profile-header";
import { PersonaTabs } from "./shared/persona-tabs";
import { ProfileLoadingSkeleton } from "./shared/realtime-indicators";
import { useCurrentUser } from "@/hooks/use-current-user";
import { resolveProfile, CATEGORY_LABELS, PARTNER_SUBTYPE_LABELS } from "@/lib/profile/role-mapper";
import type { ProfileCategory, PartnerSubtype } from "@/lib/profile/types";
import { renderClientModule } from "./client/client-modules";
import { renderPartnerModule } from "./partner/partner-modules";
import { renderNGOModule } from "./ngo/ngo-modules";
import { cn } from "@/lib/utils";

const DEMO_CATEGORIES: ProfileCategory[] = ["CLIENT", "PARTNER", "NGO"];
const DEMO_SUBTYPES: PartnerSubtype[] = [
  "PETSHOP", "VETERINARIAN", "CLINIC", "SELLER", "SERVICE_PROVIDER",
  "COMPANY", "DISTRIBUTOR", "AGRO", "FRANCHISE", "MARKETPLACE",
];

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

  function switchDemo(category: ProfileCategory, subtype?: PartnerSubtype) {
    const params = new URLSearchParams();
    params.set("category", category);
    if (subtype) params.set("subtype", subtype);
    window.location.href = `/perfil?${params.toString()}`;
  }

  return (
    <>
      <AppHeader title="Perfil" />
      <main className="mx-auto max-w-7xl flex-1 p-4 lg:p-6">
        {loading ? (
          <ProfileLoadingSkeleton />
        ) : (
          <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-6">
            {/* Sidebar módulos — desktop */}
            <aside className="hidden lg:block">
              <PersonaTabs
                modules={profile.modules}
                activeId={activeModule}
                onChange={setActiveModule}
              />
            </aside>

            <div className="min-w-0 space-y-6">
              <ProfileHeader profile={profile} />

              {/* Tabs mobile */}
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

              {/* Demo: trocar categoria */}
              <div className="rounded-2xl border border-dashed border-ecopet-gray/20 p-4">
                <p className="text-xs font-semibold text-ecopet-gray mb-3">
                  Visualizar perfil por categoria (demo mock)
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {DEMO_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => switchDemo(cat, cat === "PARTNER" ? "PETSHOP" : undefined)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                        profile.category === cat ? "bg-ecopet-green text-white" : "bg-ecopet-gray/10 hover:bg-ecopet-gray/20"
                      )}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
                {profile.category === "PARTNER" && (
                  <div className="flex flex-wrap gap-1">
                    {DEMO_SUBTYPES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => switchDemo("PARTNER", st)}
                        className={cn(
                          "rounded-full px-2 py-1 text-[10px] font-medium",
                          profile.partnerSubtype === st ? "bg-ecopet-dark text-white" : "bg-ecopet-gray/10"
                        )}
                      >
                        {PARTNER_SUBTYPE_LABELS[st]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
