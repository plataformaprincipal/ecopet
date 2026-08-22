import type { Metadata } from "next";
import { EccoPetAiLanding } from "@/components/features/ai-commerce/landing";

export const metadata: Metadata = {
  title: "EccoPet AI — Inteligência para cuidar melhor do seu pet",
  description:
    "Ferramentas gratuitas de inteligência artificial para saúde, prevenção, nutrição, comportamento e cuidados com pets.",
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
