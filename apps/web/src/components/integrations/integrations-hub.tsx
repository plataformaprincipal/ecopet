"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrationDashboard } from "./integration-dashboard";
import { ExternalIntegrationGrid } from "./external-integration-grid";
import { InternalIntegrationMap } from "./internal-integration-map";
import { AutomationLogs } from "./automation-logs";
import { AIIntegrationInsights } from "./ai-integration-insights";
import {
  getExternalForProfile,
  getInternalForProfile,
  getDashboardStatsForProfile,
  AUTOMATION_LOGS,
} from "@/lib/integrations/mock-data";
import type { ProfileCategory } from "@/lib/integrations/types";

interface IntegrationsHubProps {
  profileCategory: ProfileCategory;
}

export function IntegrationsHub({ profileCategory }: IntegrationsHubProps) {
  const [tab, setTab] = useState("dashboard");
  const external = getExternalForProfile(profileCategory);
  const internal = getInternalForProfile(profileCategory);
  const stats = getDashboardStatsForProfile(profileCategory);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading-2">Integrações</h2>
        <p className="secondary-text">Conecte sistemas externos e módulos internos da ECOPET</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex w-full flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
          <TabsTrigger value="external" className="text-xs">Externas ({external.length})</TabsTrigger>
          <TabsTrigger value="internal" className="text-xs">Internas ({internal.length})</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <IntegrationDashboard stats={stats} />
          <AIIntegrationInsights />
        </TabsContent>

        <TabsContent value="external">
          <ExternalIntegrationGrid integrations={external} />
        </TabsContent>

        <TabsContent value="internal">
          <InternalIntegrationMap integrations={internal} />
        </TabsContent>

        <TabsContent value="logs">
          <AutomationLogs logs={AUTOMATION_LOGS} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
