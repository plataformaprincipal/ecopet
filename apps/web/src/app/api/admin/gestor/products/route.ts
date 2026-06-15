import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorProducts } from "@/lib/gestor/gestor-marketplace-service";

export const GET = createGestorGetHandler(getGestorProducts);
