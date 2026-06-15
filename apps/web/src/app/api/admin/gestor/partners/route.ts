import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorPartners } from "@/lib/gestor/gestor-users-service";

export const GET = createGestorGetHandler(getGestorPartners);
