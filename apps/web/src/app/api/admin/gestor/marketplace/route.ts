import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorMarketplace } from "@/lib/gestor/gestor-marketplace-service";

export const GET = createGestorGetHandler(getGestorMarketplace);
