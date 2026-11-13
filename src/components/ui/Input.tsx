import type { InputHTMLAttributes, Ref } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

export function Input({
  className,
  error,
  id,
  ref,
  ...props
}: InputProps) {
  const errorId = id && error ? `${id}-error` : undefined;
  return (
    <div className="w-full">
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          "flex h-10 w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground",
          "placeholder:text-muted-foreground/70 transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground",
          "read-only:bg-surface-muted read-only:text-foreground read-only:cursor-default",
          error && "border-danger focus-visible:ring-danger",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

