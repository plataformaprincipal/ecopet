import { handleModuleAiAction } from "@/lib/ai/ai-route-helper";

export async function POST(request: Request) {
  return handleModuleAiAction({
    request,
    module: "social" as const,
    action: "caption",
  });
}
