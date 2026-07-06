import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getAdminAccountingModule } from "@/lib/admin/dashboard-service";

export const GET = createAdminGetHandler(getAdminAccountingModule);
