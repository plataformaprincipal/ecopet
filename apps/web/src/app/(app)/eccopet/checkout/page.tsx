import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AiCheckoutPage } from "@/components/features/ai-commerce/checkout-page";
import { isAiMonetizationFree } from "@/lib/ai-commerce/flags";

export const metadata: Metadata = {
  title: "Pagamento EccoPet AI",
  robots: { index: false, follow: false },
};

export default function Page() {
  if (isAiMonetizationFree()) {
    redirect("/eccopet");
  }
  return <AiCheckoutPage />;
}
