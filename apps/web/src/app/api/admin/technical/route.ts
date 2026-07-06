import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getAdminTechnicalModule } from "@/lib/admin/dashboard-service";

export const GET = createAdminGetHandler(getAdminTechnicalModule);
