"use client";

import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";

type Props = {
  title?: string;
  description?: string;
  className?: string;
};

export function AIEmptyState({
  title = "Nenhuma conversa ainda",
  description = "Inicie uma conversa com o assistente EcoPet quando o provedor de IA estiver configurado.",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center",
        className
      )}
    >
      <Bot className="mb-3 h-10 w-10 text-muted-foreground" aria-hidden />
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
