import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  isLoading?: boolean;
  className?: string;
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  isLoading = false,
  className,
}: StatCardProps) {
  return (
    <article
      className={cn(
        "rounded-3xl border border-border/70 bg-card p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <Skeleton className="mt-3 h-9 w-28" />
      ) : (
        <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
      )}

      {hint && !isLoading ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </article>
  );
}
