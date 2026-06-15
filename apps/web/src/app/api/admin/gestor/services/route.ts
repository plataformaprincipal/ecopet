import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorServices } from "@/lib/gestor/gestor-marketplace-service";

export const GET = createGestorGetHandler(getGestorServices);
