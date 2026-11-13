import type { ReactNode } from "react";
import { FileSpreadsheet } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground">
        <FileSpreadsheet className="size-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

