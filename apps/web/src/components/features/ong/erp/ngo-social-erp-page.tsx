"use client";

import { NgoErpModulePanel } from "@/components/features/ong/erp/ngo-erp-module-panel";
import { NGO_ERP_MODULE_CONFIG } from "@/lib/ong/erp/module-config";
import { OngCommunityPage } from "@/components/features/ong/pages/ong-community-page";

type Props = { ongId: string };

export function NgoSocialErpPage({ ongId }: Props) {
  return (
    <div className="space-y-6">
      <NgoErpModulePanel config={NGO_ERP_MODULE_CONFIG.social} />
      <div id="feed">
        <OngCommunityPage ongId={ongId} accessLevel="full" />
      </div>
    </div>
  );
}
