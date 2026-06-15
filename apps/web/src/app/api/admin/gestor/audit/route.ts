import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorAudit } from "@/lib/gestor/gestor-social-service";

export const GET = createGestorGetHandler(getGestorAudit);
