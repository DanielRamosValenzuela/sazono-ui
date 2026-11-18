"use client";

import type { ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, CircleAlert, Minus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { reportsApi, retryReportRequest } from "@/shared/api/reports-api";
import { formatMoney } from "@/shared/lib/format";
import type {
  KpiBlock,
  KpiDelta,
  KpiKey,
  ReportFilters,
} from "@/shared/types/reports";
import { formatDateKey, formatDecimal, formatPercent } from "./report-format";
import type { DateRange } from "./report-range";

type KpiStripProps = {
  token: string | null;
  branchId: string;
  range: DateRange;
  filters: ReportFilters;
  enabled: boolean;
};

type KpiDefinition = {
  key: KpiKey;
  label: string;
  format: (block: KpiBlock, locale: string) => string;
};

const KPI_DEFINITIONS: KpiDefinition[] = [
  { key: "netSales", label: "cardNetSales", format: (b) => formatMoney(b.netSales) },
  { key: "tips", label: "cardTips", format: (b) => formatMoney(b.tips) },
  { key: "bills", label: "cardBills", format: (b) => String(b.bills) },
  {
    key: "averageTicket",
    label: "cardAverageTicket",
    format: (b) => formatMoney(b.averageTicket),
  },
  { key: "guests", label: "kpiGuests", format: (b) => String(b.guests) },
  {
    key: "tablesTurnover",
    label: "kpiTurnover",
    format: (b, locale) =>
      b.tablesTurnover === null ? "—" : formatDecimal(b.tablesTurnover, locale),
  },
];

const MONEY_KPI_KEYS: KpiKey[] = ["netSales", "tips", "averageTicket"];

function Delta({
  delta,
  locale,
  money,
}: {
  delta: KpiDelta;
  locale: string;
  money: boolean;
}) {
  const t = useTranslations("Reports");
  const direction = Math.sign(Number(delta.absolute));
  const Icon = direction > 0 ? ArrowUp : direction < 0 ? ArrowDown : Minus;
  const text =
    delta.percent !== null
      ? formatPercent(delta.percent, locale, true)
      : money
        ? `${direction > 0 ? "+" : direction < 0 ? "-" : ""}${formatMoney(
            Math.abs(Number(delta.absolute))
          )}`
        : new Intl.NumberFormat(locale, { signDisplay: "exceptZero" }).format(
            Number(delta.absolute)
          );

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
        direction > 0 && "text-emerald-600 dark:text-emerald-400",
        direction < 0 && "text-destructive",
        direction === 0 && "text-muted-foreground"
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      <span>{text}</span>
      <span className="sr-only">{t("kpiDeltaSr")}</span>
    </span>
  );
}

function KpiCard({
  label,
  value,
  footer,
}: {
  label: string;
  value: string;
  footer?: ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <div className="mt-1.5 min-h-4 text-xs text-muted-foreground">{footer}</div>
    </article>
  );
}

export function KpiStrip({
  token,
  branchId,
  range,
  filters,
  enabled,
}: KpiStripProps) {
  const t = useTranslations("Reports");
  const locale = useLocale();
  const query = useQuery({
    queryKey: ["reports", "kpis", branchId, range.from, range.to, filters],
    enabled: enabled && Boolean(token),
    placeholderData: keepPreviousData,
    retry: retryReportRequest,
    queryFn: () =>
      reportsApi.getSummaryKpis(token!, branchId, { ...range, filters }, true),
  });
  const data = query.data;

  if (query.isError) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm"
      >
        <CircleAlert className="size-4 text-destructive" aria-hidden="true" />
        <span className="text-destructive">{t("kpiError")}</span>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => void query.refetch()}
        >
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (!data) {
    if (!query.isLoading) {
      return null;
    }

    return (
      <section
        aria-label={t("statsAria")}
        aria-busy="true"
        className="grid grid-cols-2 gap-4 xl:grid-cols-3"
      >
        {KPI_DEFINITIONS.map((definition) => (
          <Skeleton key={definition.key} className="h-28 w-full rounded-3xl" />
        ))}
      </section>
    );
  }

  const { current, previous, delta, previousRange } = data;

  return (
    <div className="space-y-2">
      <section
        aria-label={t("statsAria")}
        aria-busy={query.isPlaceholderData}
        className={cn(
          "grid grid-cols-2 gap-4 transition-opacity xl:grid-cols-3",
          query.isPlaceholderData && "opacity-60"
        )}
      >
        {KPI_DEFINITIONS.map((definition) => {
          const keyDelta = delta?.[definition.key] ?? null;
          const hasRefunds =
            definition.key === "netSales" && Number(current.refunded) !== 0;

          return (
            <KpiCard
              key={definition.key}
              label={t(definition.label)}
              value={definition.format(current, locale)}
              footer={
                <div className="space-y-0.5">
                  {keyDelta && previous ? (
                    <div className="flex flex-wrap items-center gap-x-2">
                      <Delta
                          delta={keyDelta}
                          locale={locale}
                          money={MONEY_KPI_KEYS.includes(definition.key)}
                        />
                      <span>
                        {t("kpiPrevious", {
                          value: definition.format(previous, locale),
                        })}
                      </span>
                    </div>
                  ) : null}
                  {hasRefunds ? (
                    <p>
                      {t("kpiGrossRefunded", {
                        gross: formatMoney(current.grossSales),
                        refunded: formatMoney(current.refunded),
                      })}
                    </p>
                  ) : null}
                </div>
              }
            />
          );
        })}
      </section>
      {previousRange ? (
        <p className="text-xs text-muted-foreground">
          {t("kpiCompareCaption", {
            from: formatDateKey(previousRange.from, locale),
            to: formatDateKey(previousRange.to, locale),
          })}
        </p>
      ) : null}
    </div>
  );
}
