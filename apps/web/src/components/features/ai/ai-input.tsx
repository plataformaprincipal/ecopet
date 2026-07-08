"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onSend: (message: string) => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export function AIInput({
  onSend,
  disabled = false,
  placeholder = "Digite sua mensagem…",
  className,
}: Props) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setValue("");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || sending}
        rows={2}
        className="min-h-[44px] resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSubmit(e);
          }
        }}
      />
      <Button type="submit" size="icon" disabled={disabled || sending || !value.trim()} aria-label="Enviar">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
