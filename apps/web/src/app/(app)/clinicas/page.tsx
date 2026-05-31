import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent } from "@/components/ui/card";

export default function ClinicasPage() {
  return (
    <>
      <AppHeader title="Clínicas" />
      <main className="flex-1 p-4 lg:p-8">
        <Card>
          <CardContent className="p-8 text-center text-ecopet-gray">
            <p>Busca por geolocalização — configure GOOGLE_MAPS_API_KEY</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
