import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorSupport } from "@/lib/gestor/gestor-support-service";

export const GET = createGestorGetHandler(getGestorSupport);
