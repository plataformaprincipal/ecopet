import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getAdminExecutiveDashboard } from "@/lib/admin/dashboard-service";

export const GET = createAdminGetHandler(getAdminExecutiveDashboard);
