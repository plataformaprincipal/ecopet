import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorQuality } from "@/lib/gestor/gestor-quality-service";

export const GET = createGestorGetHandler(() => getGestorQuality());
