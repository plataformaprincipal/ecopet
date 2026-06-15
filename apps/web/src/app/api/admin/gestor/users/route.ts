import { createGestorGetHandler } from "@/lib/gestor/create-route";
import { getGestorUsers } from "@/lib/gestor/gestor-users-service";

export const GET = createGestorGetHandler(getGestorUsers);
