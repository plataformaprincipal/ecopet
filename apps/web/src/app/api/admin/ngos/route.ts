import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getGestorOngs } from "@/lib/gestor/gestor-users-service";

export const GET = createAdminGetHandler(getGestorOngs);
