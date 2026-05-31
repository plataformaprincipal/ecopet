import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const vets = [
  { name: "Dr. Carlos Mendes", crmv: "SP-12345", spec: "Clínica Geral", verified: true },
];

export default function VeterinariosPage() {
  return (
    <>
      <AppHeader title="Veterinários" />
      <main className="flex-1 p-4 lg:p-8">
        <div className="grid gap-4 lg:grid-cols-2">
          {vets.map((v) => (
            <Card key={v.crmv}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-16 w-16 rounded-full bg-ecopet-green/20" />
                <div className="flex-1">
                  <p className="font-bold flex items-center gap-2">
                    {v.name}
                    {v.verified && <Badge variant="vet">Veterinário</Badge>}
                  </p>
                  <p className="text-sm text-ecopet-gray">CRMV {v.crmv} · {v.spec}</p>
                </div>
                <Button size="sm">Agendar</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
