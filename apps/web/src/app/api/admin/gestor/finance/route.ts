import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorFinance } from "@/lib/gestor/gestor-support-service";

export const GET = createGestorGetHandler(getGestorFinance);
