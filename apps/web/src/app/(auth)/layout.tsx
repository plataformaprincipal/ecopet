import { AuthLayoutSidebar } from "@/components/features/auth/auth-layout-sidebar";
import { AuthLayoutLanguageBar } from "@/components/features/auth/auth-layout-language-bar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-ecopet-cream/40 via-white to-white dark:from-ecopet-dark-bg dark:via-ecopet-dark-bg dark:to-ecopet-dark-bg lg:flex-row">
      <AuthLayoutSidebar />
      <div className="relative flex flex-1 flex-col">
        <AuthLayoutLanguageBar />
        <div className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-8 sm:px-6 lg:items-center lg:py-12">
          {children}
        </div>
      </div>
    </div>
  );
}
