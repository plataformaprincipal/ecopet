import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getAdminMarketingModule } from "@/lib/admin/dashboard-service";

export const GET = createAdminGetHandler(getAdminMarketingModule);
