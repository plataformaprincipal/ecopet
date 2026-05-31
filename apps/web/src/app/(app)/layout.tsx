import { MainNavigation } from "@/components/navigation/main-navigation";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { EcopetAIAssistant } from "@/components/ai/ecopet-ai-assistant";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-ecopet-dark-bg">
      <MainNavigation />
      <div className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </div>
      <BottomNav />
      <EcopetAIAssistant />
    </div>
  );
}
