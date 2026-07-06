import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getAdminLegalModule } from "@/lib/admin/dashboard-service";

export const GET = createAdminGetHandler(getAdminLegalModule);
