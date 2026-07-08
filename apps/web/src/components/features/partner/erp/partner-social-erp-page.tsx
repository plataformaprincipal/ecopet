"use client";

import { PartnerErpModulePanel } from "./partner-erp-module-panel";
import { PARTNER_ERP_MODULE_CONFIG } from "@/lib/partner/erp/module-config";
import { PartnerCommunityPage } from "@/components/features/partner/pages/partner-community-page";
import type { PartnerAccessLevel } from "@/lib/partner/access";

type Props = {
  partnerId: string;
  accessLevel: PartnerAccessLevel;
};

export function PartnerSocialErpPage({ partnerId, accessLevel }: Props) {
  return (
    <div className="space-y-6">
      <PartnerErpModulePanel config={PARTNER_ERP_MODULE_CONFIG.social} />
      <div id="feed">
        <PartnerCommunityPage partnerId={partnerId} accessLevel={accessLevel} />
      </div>
    </div>
  );
}
