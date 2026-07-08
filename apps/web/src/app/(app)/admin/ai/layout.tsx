import { AdminAiShell } from "@/components/features/admin/admin-ai-shell";

export default function AdminAiLayout({ children }: { children: React.ReactNode }) {
  return <AdminAiShell>{children}</AdminAiShell>;
}
