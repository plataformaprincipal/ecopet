import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getAdminPermissionsModule } from "@/lib/admin/dashboard-service";

export const GET = createAdminGetHandler(getAdminPermissionsModule);
