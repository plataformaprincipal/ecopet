import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getGestorAudit } from "@/lib/gestor/gestor-social-service";

export const GET = createAdminGetHandler(getGestorAudit);
