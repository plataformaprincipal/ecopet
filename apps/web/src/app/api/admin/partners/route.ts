import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getGestorPartners } from "@/lib/gestor/gestor-users-service";

export const GET = createAdminGetHandler(getGestorPartners);
