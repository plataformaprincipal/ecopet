import { apiSuccess } from "@/lib/api-response";
import { listEccoPetSaudeQuotes } from "@/lib/eccopet-saude/plans";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiSuccess({
    seller: "ECCOPET",
    recurringBilling: false,
    splitReady: false,
    disclaimer:
      "EccoPet Saúde não é um seguro. Os valores vêm do Pricing Engine sobre SKUs de catálogo de saúde. Itens CATALOG_ONLY não são cobrados até estarem PURCHASABLE.",
    plans: listEccoPetSaudeQuotes(),
  });
}
