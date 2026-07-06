import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getAdminItModule } from "@/lib/admin/dashboard-service";

export const GET = createAdminGetHandler(getAdminItModule);
