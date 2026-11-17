"use client";

import type { ReactNode } from "react";
import { CircleAlert, Inbox } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type ReportQueryStateProps = {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  onRetry: () => void;
  children: ReactNode;
};

export function ReportQueryState({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  children,
}: ReportQueryStateProps) {
  const t = useTranslations("Reports");

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-3xl border border-destructive/25 bg-destructive/8 px-6 py-10 text-center"
      >
        <CircleAlert className="size-6 text-destructive" />
        <div>
          <p className="font-semibold text-destructive">{t("errorTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("errorDescription")}</p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={onRetry}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border/70 bg-card px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Inbox className="size-6" />
        </span>
        <div>
          <p className="font-semibold">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("emptyDescription")}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

type LoadMoreProps = {
  hasNextPage: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
};

export function LoadMore({ hasNextPage, isFetching, onLoadMore }: LoadMoreProps) {
  const t = useTranslations("Reports");

  if (!hasNextPage) {
    return null;
  }

  return (
    <div className="flex justify-center pt-4">
      <Button
        variant="outline"
        className="rounded-full"
        disabled={isFetching}
        onClick={onLoadMore}
      >
        {isFetching ? <Spinner /> : null}
        {isFetching ? t("loadingMore") : t("loadMore")}
      </Button>
    </div>
  );
}

type DetailGridProps = {
  items: Array<[label: string, value: ReactNode]>;
  className?: string;
};

export function DetailGrid({ items, className }: DetailGridProps) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-3 sm:grid-cols-2", className)}>
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
          <dd className="mt-0.5 text-sm font-medium break-words tabular-nums">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
