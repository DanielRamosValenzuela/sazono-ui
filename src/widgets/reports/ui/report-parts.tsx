"use client";

import type { ReactNode } from "react";
import { CircleAlert, Inbox } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/shared/lib/format";

export function ShareCell({ share }: { share: number }) {
  const locale = useLocale();
  const label = new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(share / 100);

  return (
    <div className="flex items-center justify-end gap-2">
      <div
        className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(100, Math.max(0, share))}%` }}
        />
      </div>
      <span className="w-14 text-right">{label}</span>
    </div>
  );
}

export function RefundBadge({
  status,
  refunded,
}: {
  status: "NONE" | "PARTIAL" | "FULL";
  refunded: string | number;
}) {
  const t = useTranslations("Reports");

  if (status === "NONE") {
    return null;
  }

  return (
    <Badge variant="destructive" className="tabular-nums">
      {status === "PARTIAL"
        ? t("refundBadgePartial")
        : t("refundBadgeFull", { amount: formatMoney(refunded) })}
    </Badge>
  );
}

type ReportQueryStateProps = {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  isRefreshing?: boolean;
  isFiltered?: boolean;
  onClearFilters?: () => void;
  onRetry: () => void;
  children: ReactNode;
};

export function ReportQueryState({
  isLoading,
  isError,
  isEmpty,
  isRefreshing = false,
  isFiltered = false,
  onClearFilters,
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
          <p className="font-semibold">
            {isFiltered ? t("emptyFilteredTitle") : t("emptyTitle")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFiltered ? t("emptyFilteredDescription") : t("emptyDescription")}
          </p>
        </div>
        {isFiltered && onClearFilters ? (
          <Button variant="outline" className="rounded-full" onClick={onClearFilters}>
            {t("filters.clearAll")}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      aria-busy={isRefreshing}
      className={cn("transition-opacity", isRefreshing && "opacity-60")}
    >
      {children}
    </div>
  );
}

type ToggleGroupProps<T extends string> = {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
};

export function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: ToggleGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {options.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={value === option.value ? "default" : "outline"}
          className="min-h-10 rounded-full sm:min-h-0"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
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

export function RefundedItemsList({
  items,
  wasteLabel,
}: {
  items: Array<{
    billItemId: string;
    name: string;
    quantity: number;
    amount: string;
    kitchenWaste: boolean;
  }>;
  wasteLabel: string;
}) {
  return (
    <ul className="space-y-0.5 text-xs text-muted-foreground">
      {items.map((item) => (
        <li
          key={item.billItemId}
          className="flex flex-wrap items-baseline justify-between gap-x-3 break-words"
        >
          <span className="min-w-0">
            {item.quantity} x {item.name}
            {item.kitchenWaste ? ` · ${wasteLabel}` : ""}
          </span>
          <span className="tabular-nums">{formatMoney(item.amount)}</span>
        </li>
      ))}
    </ul>
  );
}
