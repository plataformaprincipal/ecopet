import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorAppointments } from "@/lib/gestor/gestor-marketplace-service";

export const GET = createGestorGetHandler(getGestorAppointments);
