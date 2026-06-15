import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorSystemHealth } from "@/lib/gestor/gestor-metrics-service";

export const GET = createGestorGetHandler(() => getGestorSystemHealth());
