import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorOngs } from "@/lib/gestor/gestor-users-service";

export const GET = createGestorGetHandler(getGestorOngs);
