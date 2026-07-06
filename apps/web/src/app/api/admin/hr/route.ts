import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getAdminHrModule } from "@/lib/admin/dashboard-service";

export const GET = createAdminGetHandler(getAdminHrModule);
