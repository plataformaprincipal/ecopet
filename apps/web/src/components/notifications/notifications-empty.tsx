import { BellOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface NotificationsEmptyProps {
  hasSearch?: boolean;
}

export function NotificationsEmpty({ hasSearch }: NotificationsEmptyProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center px-6 py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-ecopet-green/10">
          <BellOff className="h-8 w-8 text-ecopet-green" />
        </div>
        <h3 className="font-display text-lg font-bold text-ecopet-dark dark:text-white">
          {hasSearch ? "Nenhum resultado" : "Tudo em dia!"}
        </h3>
        <p className="mt-2 max-w-xs text-sm text-ecopet-gray">
          {hasSearch
            ? "Tente outro termo ou limpe os filtros para ver mais notificações."
            : "Você não tem notificações nesta categoria no momento."}
        </p>
      </CardContent>
    </Card>
  );
}
