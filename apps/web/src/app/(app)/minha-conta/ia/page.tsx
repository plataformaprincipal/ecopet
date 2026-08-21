import type { Metadata } from "next";
import { MyAiServicesPage } from "@/components/features/ai-commerce/my-services";

export const metadata: Metadata = {
  title: "Meus serviços de IA",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MyAiServicesPage />;
}
