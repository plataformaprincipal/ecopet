import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorOverview } from "@/lib/gestor/gestor-metrics-service";

export const GET = createGestorGetHandler(getGestorOverview);
