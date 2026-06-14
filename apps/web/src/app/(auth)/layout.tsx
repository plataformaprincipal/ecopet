import { AuthLayoutSidebar } from "@/components/features/auth/auth-layout-sidebar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AuthLayoutSidebar />
      <div className="flex flex-1 items-start justify-center overflow-y-auto p-6 lg:items-center">{children}</div>
    </div>
  );
}
