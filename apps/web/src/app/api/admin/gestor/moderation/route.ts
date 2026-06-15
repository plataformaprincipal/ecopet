import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorModeration } from "@/lib/gestor/gestor-social-service";

export const GET = createGestorGetHandler(getGestorModeration);
