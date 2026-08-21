import type { Metadata } from "next";
import { AiCheckoutPage } from "@/components/features/ai-commerce/checkout-page";

export const metadata: Metadata = {
  title: "Pagamento EccoPet AI",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AiCheckoutPage />;
}
