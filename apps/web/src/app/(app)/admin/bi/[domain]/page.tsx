import { notFound } from "next/navigation";
import { AdminBiIntelligencePanel } from "@/components/features/admin/admin-bi-intelligence-panel";
import { isBiDomain, type BiDomain } from "@/lib/admin/bi/domains";

type Props = { params: Promise<{ domain: string }> };

export default async function AdminBiDomainPage({ params }: Props) {
  const { domain } = await params;
  if (domain === "executive") {
    // canonical hub
    const { redirect } = await import("next/navigation");
    redirect("/admin/bi");
  }
  if (!isBiDomain(domain)) notFound();
  return <AdminBiIntelligencePanel domain={domain as BiDomain} />;
}
