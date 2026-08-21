import type { Metadata } from "next";
import { AiConfirmation } from "@/components/features/ai-commerce/confirmation";

export const metadata: Metadata = {
  title: "Confirmação EccoPet AI",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <AiConfirmation orderId={orderId} />;
}
