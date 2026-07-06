import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  className?: string;
};

export function AdminEmptyState({ title = "Nenhum dado encontrado", description, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white px-6 py-16 text-center dark:bg-white/5",
        className
      )}
      role="status"
    >
      <Inbox className="mb-3 h-10 w-10 text-muted-foreground/50" aria-hidden />
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
