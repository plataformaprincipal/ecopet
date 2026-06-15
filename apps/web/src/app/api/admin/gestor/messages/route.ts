import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorMessages } from "@/lib/gestor/gestor-support-service";

export const GET = createGestorGetHandler(getGestorMessages);
