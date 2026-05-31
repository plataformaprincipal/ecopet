"use client";

import { RobotCard } from "./robot-card";
import { AIIntegrationInsights } from "./ai-integration-insights";
import { AutomationLogs } from "./automation-logs";
import { getRobotsForProfile, AUTOMATION_LOGS } from "@/lib/integrations/mock-data";
import type { ProfileCategory } from "@/lib/integrations/types";
import { RealtimeIndicators } from "@/components/profile/shared/realtime-indicators";

interface RobotHubProps {
  profileCategory: ProfileCategory;
}

export function RobotHub({ profileCategory }: RobotHubProps) {
  const robots = getRobotsForProfile(profileCategory);
  const active = robots.filter((r) => r.status === "active").length;
  const alerts = robots.reduce((s, r) => s + r.alerts, 0);
  const errors = robots.filter((r) => r.status === "error").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading-2">Robôs 24h</h2>
        <p className="secondary-text">Automações inteligentes contínuas — monitoramento, sugestões e execução</p>
      </div>

      <RealtimeIndicators items={[
        { label: "Robôs ativos", value: `${active}/${robots.length}`, status: "online" },
        { label: "Alertas", value: String(alerts), status: alerts > 0 ? "warning" : "online" },
        { label: "Erros", value: String(errors), status: errors > 0 ? "warning" : "online" },
        { label: "Modo", value: "24/7", status: "online" },
      ]} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {robots.map((robot) => (
          <RobotCard key={robot.id} robot={robot} />
        ))}
      </div>

      <AIIntegrationInsights />

      <div>
        <h3 className="section-title mb-3">Histórico recente</h3>
        <AutomationLogs logs={AUTOMATION_LOGS.slice(0, 5)} compact />
      </div>
    </div>
  );
}

export function ClientRobotsPanel() {
  return <RobotHub profileCategory="CLIENT" />;
}

export function PartnerRobotsPanel() {
  return <RobotHub profileCategory="PARTNER" />;
}

export function NGORobotsPanel() {
  return <RobotHub profileCategory="NGO" />;
}
