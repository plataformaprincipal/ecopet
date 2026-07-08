import { POST as handleWebhook } from "@/lib/webhooks/webhook-handler";

export async function POST(request: Request) {
  return handleWebhook(request, "whatsapp");
}
