import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getAdminFinanceModule } from "@/lib/admin/dashboard-service";

export const GET = createAdminGetHandler(getAdminFinanceModule);
