import type { Metadata } from "next";
import { EccoPetAiLanding } from "@/components/features/ai-commerce/landing";

export const metadata: Metadata = {
  title: "EccoPet AI — Saúde e cuidado animal potencializados por inteligência artificial",
  description:
    "Avaliações, análises visuais, exames, acompanhamento e relatórios personalizados com inteligência artificial especializada em pets.",
  alternates: { canonical: "/eccopet" },
  openGraph: {
    title: "EccoPet AI",
    description: "Inteligência especializada para cuidar melhor do seu pet.",
    url: "/eccopet",
  },
  robots: { index: true, follow: true },
};

export default function EccoPetPage() {
  return <EccoPetAiLanding />;
}
