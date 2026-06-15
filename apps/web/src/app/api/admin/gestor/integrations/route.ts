import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorIntegrations } from "@/lib/gestor/gestor-support-service";

export const GET = createGestorGetHandler(() => getGestorIntegrations());
