import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorSocial } from "@/lib/gestor/gestor-social-service";

export const GET = createGestorGetHandler(getGestorSocial);
