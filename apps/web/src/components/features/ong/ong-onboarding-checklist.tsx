"use client";

import { PartnerOnboardingChecklist } from "@/components/features/partner/partner-onboarding-checklist";
import type { OngOnboardingSnapshot } from "@/lib/ong/onboarding";

export function OngOnboardingChecklist({ snapshot }: { snapshot: OngOnboardingSnapshot }) {
  return (
    <div className="space-y-3" data-testid="ong-onboarding-checklist">
      <PartnerOnboardingChecklist snapshot={snapshot} connectHref="/ngo/financeiro" />
      <p className="text-sm text-muted-foreground">
        Mensalidade EccoPet: R$ {snapshot.monthlyFeeBrl.toFixed(2)} · Ads gratuitos:{" "}
        {snapshot.adsCreditsRemaining}/{snapshot.adsCreditsPerYear} restantes neste ano.
      </p>
    </div>
  );
}
