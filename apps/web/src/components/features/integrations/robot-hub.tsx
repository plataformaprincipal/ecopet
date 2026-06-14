"use client";

import { Bot } from "lucide-react";
import { RobotCard } from "./robot-card";
import { AIIntegrationInsights } from "./ai-integration-insights";
import { AutomationLogs } from "./automation-logs";
import { EmptyState } from "@/components/ui/empty-state";
import { getRobotsForProfile, AUTOMATION_LOGS } from "@/lib/integrations/empty";
import type { ProfileCategory } from "@/lib/integrations/types";
import { useTranslation } from "@/providers/i18n-provider";

interface RobotHubProps {
  profileCategory: ProfileCategory;
}

export function RobotHub({ profileCategory }: RobotHubProps) {
  const { t } = useTranslation();
  const robots = getRobotsForProfile(profileCategory);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading-2">Robôs 24h</h2>
        <p className="secondary-text">Automações inteligentes contínuas — monitoramento, sugestões e execução</p>
      </div>

      {robots.length === 0 ? (
        <EmptyState
          icon={Bot}
          title={t("empty.agro.noRobots")}
          description={t("empty.admin.noData")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {robots.map((robot) => (
            <RobotCard key={robot.id} robot={robot} />
          ))}
        </div>
      )}

      <AIIntegrationInsights />

      <div>
        <h3 className="section-title mb-3">Histórico recente</h3>
        {AUTOMATION_LOGS.length === 0 ? (
          <EmptyState icon={Bot} title={t("empty.admin.noData")} description={t("empty.admin.noData")} />
        ) : (
          <AutomationLogs logs={AUTOMATION_LOGS.slice(0, 5)} compact />
        )}
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
