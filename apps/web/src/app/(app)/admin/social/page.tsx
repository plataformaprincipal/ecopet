import Link from "next/link";
import { AdminHeader } from "@/components/features/admin/admin-header";
import { AdminSocialModerationPanel } from "@/components/features/social/feed/admin-social-moderation-panel";
import { AdminSocialReportsPanel } from "@/components/features/social/feed/admin-social-reports-panel";

export default function AdminSocialPage() {
  return (
    <>
      <AdminHeader
        title="Social e denúncias"
        description="Moderação de posts, comentários e denúncias pendentes."
      />
      <div className="space-y-8 p-6">
        <section aria-labelledby="social-posts-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="social-posts-heading" className="text-lg font-semibold">
              Posts recentes
            </h2>
            <Link href="/dashboard/admin/social/posts" className="text-sm text-ecopet-green hover:underline">
              Ver painel completo
            </Link>
          </div>
          <AdminSocialModerationPanel type="posts" />
        </section>
        <section aria-labelledby="social-reports-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="social-reports-heading" className="text-lg font-semibold">
              Denúncias pendentes
            </h2>
            <Link href="/dashboard/admin/social/reports" className="text-sm text-ecopet-green hover:underline">
              Ver todas
            </Link>
          </div>
          <AdminSocialReportsPanel />
        </section>
      </div>
    </>
  );
}
