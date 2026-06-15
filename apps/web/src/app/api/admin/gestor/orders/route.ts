import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorOrders } from "@/lib/gestor/gestor-marketplace-service";

export const GET = createGestorGetHandler(getGestorOrders);
