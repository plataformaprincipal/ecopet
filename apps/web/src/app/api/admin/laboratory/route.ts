import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getAdminLaboratoryModule } from "@/lib/admin/dashboard-service";

export const GET = createAdminGetHandler(getAdminLaboratoryModule);
