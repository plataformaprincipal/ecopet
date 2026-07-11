import { handleModuleAiAction } from "@/lib/ai/ai-route-helper";

export async function POST(request: Request) {
  return handleModuleAiAction({
    request,
    module: "products" as const,
    action: "product-tags",
  });
}
