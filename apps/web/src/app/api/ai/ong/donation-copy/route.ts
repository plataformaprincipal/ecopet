import { handleModuleAiAction } from "@/lib/ai/ai-route-helper";

export async function POST(request: Request) {
  return handleModuleAiAction({
    request,
    module: "ong" as const,
    action: "donation-copy",
  });
}
