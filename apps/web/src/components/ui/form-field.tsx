import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
  ...props
}: FormFieldProps) {
  const hintId = hint ? `${htmlFor ?? "field"}-hint` : undefined;
  const errorId = error ? `${htmlFor ?? "field"}-error` : undefined;

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)} {...props}>
      {label ? (
        <label htmlFor={htmlFor} className="label-text">
          {label}
          {required ? (
            <span className="ml-0.5 text-ep-danger" aria-hidden>
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {hint && !error ? (
        <p id={hintId} className="caption-text">
          {hint}
        </p>
      ) : null}
      {error ? <FormMessage id={errorId}>{error}</FormMessage> : null}
    </div>
  );
}

export function FormMessage({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return (
    <p className={cn("text-xs font-medium text-ep-danger", className)} role="alert" {...props}>
      {children}
    </p>
  );
}
