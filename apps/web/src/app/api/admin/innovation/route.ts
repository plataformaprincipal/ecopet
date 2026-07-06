import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getAdminInnovationModule } from "@/lib/admin/dashboard-service";

export const GET = createAdminGetHandler(getAdminInnovationModule);
