import { AuthLayoutSidebar } from "@/components/features/auth/auth-layout-sidebar";
import { AuthLayoutLanguageBar } from "@/components/features/auth/auth-layout-language-bar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AuthLayoutSidebar />
      <div className="relative flex flex-1 flex-col">
        <AuthLayoutLanguageBar />
        <div className="flex flex-1 items-start justify-center overflow-y-auto p-6 lg:items-center">{children}</div>
      </div>
    </div>
  );
}
