"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type StepValidationFeedbackProps = {
  messages: string[];
  className?: string;
  id?: string;
};

export function StepValidationFeedback({ messages, className, id = "step-validation-feedback" }: StepValidationFeedbackProps) {
  if (!messages.length) return null;

  return (
    <div
      id={id}
      role="alert"
      aria-live="assertive"
      className={cn(
        "rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
        className
      )}
    >
      {messages.length === 1 ? (
        <p className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{messages[0]}</span>
        </p>
      ) : (
        <div className="space-y-2">
          <p className="flex items-start gap-2 font-medium">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>Corrija os seguintes itens:</span>
          </p>
          <ul className="list-disc space-y-1 pl-9">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
