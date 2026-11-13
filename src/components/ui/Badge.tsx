import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

const badgeStyles: Record<BadgeVariant, string> = {
  neutral: "bg-surface-muted text-foreground border-border",
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success-bg text-success border-success/20",
  warning: "bg-warning-bg text-warning border-warning/20",
  danger: "bg-danger-bg text-danger border-danger/20",
  info: "bg-info-bg text-info border-info/20",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium leading-tight",
        badgeStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

