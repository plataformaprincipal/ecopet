import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getAdminAdministrativeModule } from "@/lib/admin/dashboard-service";

export const GET = createAdminGetHandler(getAdminAdministrativeModule);
