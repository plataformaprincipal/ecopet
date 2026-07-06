import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getAdminCommercialModule } from "@/lib/admin/dashboard-service";

export const GET = createAdminGetHandler(getAdminCommercialModule);
