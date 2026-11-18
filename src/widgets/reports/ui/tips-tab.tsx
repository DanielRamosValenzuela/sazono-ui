"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CircleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { reportsApi, retryReportRequest } from "@/shared/api/reports-api";
import { formatMoney } from "@/shared/lib/format";
import { BarChart } from "@/shared/ui/charts";
import { StatCard } from "@/shared/ui/stat-card";
import type {
  ReportFilters,
  TipDayRow,
  TipPayoutStatus,
  TipWaiterRow,
} from "@/shared/types/reports";
import { DataList, type DataColumn } from "./data-list";
import { formatDateKey, formatPercent } from "./report-format";
import { ReportQueryState } from "./report-parts";
import type { DateRange } from "./report-range";

type TipsTabProps = {
  token: string | null;
  branchId: string;
  range: DateRange;
  filters: ReportFilters;
  enabled: boolean;
  isFiltered: boolean;
  onClearFilters: () => void;
};

const STATUS_VARIANTS: Record<
  TipPayoutStatus,
  "outline" | "secondary" | "destructive"
> = {
  NO_CARD_TIPS: "outline",
  PENDING: "secondary",
  OVERDUE: "destructive",
};

export function TipsTab({
  token,
  branchId,
  range,
  filters,
  enabled,
  isFiltered,
  onClearFilters,
}: TipsTabProps) {
  const t = useTranslations("Reports");
  const locale = useLocale();
  const query = useQuery({
    queryKey: ["reports", "tips", branchId, range.from, range.to, filters],
    enabled: enabled && Boolean(token),
    placeholderData: keepPreviousData,
    retry: retryReportRequest,
    queryFn: () => reportsApi.getTips(token!, branchId, { ...range, filters }),
  });
  const data = query.data;
  const compact = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const isEmpty =
    !data ||
    (data.byWaiter.length === 0 &&
      data.byDay.length === 0 &&
      Number(data.totals.tip) === 0 &&
      Number(data.totals.returned) === 0);

  const waiterColumns: DataColumn<TipWaiterRow>[] = [
    { id: "name", label: t("colWaiter"), cell: (row) => row.name },
    { id: "bills", label: t("colBills"), align: "right", cell: (row) => row.bills },
    {
      id: "sales",
      label: t("colSales"),
      align: "right",
      cell: (row) => formatMoney(row.sales),
    },
    {
      id: "tip",
      label: t("colTip"),
      align: "right",
      cell: (row) => formatMoney(row.tip),
    },
    {
      id: "tipPercent",
      label: t("colTipPercent"),
      align: "right",
      cell: (row) => formatPercent(row.tipPercent, locale),
    },
    {
      id: "returned",
      label: t("colReturned"),
      align: "right",
      cell: (row) => formatMoney(row.returned),
    },
    {
      id: "tipOwed",
      label: t("colTipOwed"),
      align: "right",
      cell: (row) => formatMoney(row.tipOwed),
    },
    {
      id: "cashTip",
      label: t("colCashTip"),
      align: "right",
      cell: (row) => formatMoney(row.cashTip),
    },
    {
      id: "cardTip",
      label: t("colCardTip"),
      align: "right",
      cell: (row) => formatMoney(row.cardTip),
    },
    {
      id: "otherTip",
      label: t("colOtherTip"),
      align: "right",
      cell: (row) => formatMoney(row.otherTip),
    },
    {
      id: "cardTipPending",
      label: t("colCardPending"),
      align: "right",
      cell: (row) => formatMoney(row.cardTipPending),
    },
    {
      id: "cardTipOverdue",
      label: t("colCardOverdue"),
      align: "right",
      cell: (row) => formatMoney(row.cardTipOverdue),
    },
    {
      id: "payoutStatus",
      label: t("colPayoutStatus"),
      cell: (row) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant={STATUS_VARIANTS[row.payoutStatus]}>
            {t(`tipStatus.${row.payoutStatus}`)}
          </Badge>
          {row.oldestCardTipDate && row.oldestCardTipDueDate ? (
            <span className="text-xs font-normal text-muted-foreground">
              {t("tipOldest", {
                date: formatDateKey(row.oldestCardTipDate, locale),
                days: row.oldestCardTipAgeDays ?? 0,
                due: formatDateKey(row.oldestCardTipDueDate, locale),
              })}
            </span>
          ) : null}
        </div>
      ),
    },
  ];

  const dayColumns: DataColumn<TipDayRow>[] = [
    {
      id: "date",
      label: t("colDate"),
      cell: (row) => formatDateKey(row.date, locale),
    },
    { id: "bills", label: t("colBills"), align: "right", cell: (row) => row.bills },
    {
      id: "sales",
      label: t("colSales"),
      align: "right",
      cell: (row) => formatMoney(row.sales),
    },
    {
      id: "tip",
      label: t("colTip"),
      align: "right",
      cell: (row) => formatMoney(row.tip),
    },
    {
      id: "tipPercent",
      label: t("colTipPercent"),
      align: "right",
      cell: (row) => formatPercent(row.tipPercent, locale),
    },
    {
      id: "returned",
      label: t("colReturned"),
      align: "right",
      cell: (row) => formatMoney(row.returned),
    },
  ];

  return (
    <ReportQueryState
      isLoading={query.isLoading}
      isError={query.isError}
      isEmpty={isEmpty}
      isRefreshing={query.isPlaceholderData}
      isFiltered={isFiltered}
      onClearFilters={onClearFilters}
      onRetry={() => void query.refetch()}
    >
      {data ? (
        <div className="space-y-6">
          <section
            aria-label={t("tipsSummary")}
            className="grid grid-cols-2 gap-4 xl:grid-cols-4"
          >
            <StatCard label={t("tipTotal")} value={formatMoney(data.totals.tip)} />
            <StatCard
              label={t("tipOverSales")}
              value={formatPercent(data.totals.tipPercent, locale)}
              hint={t("tipOverSalesHint", { sales: formatMoney(data.totals.sales) })}
            />
            <StatCard
              label={t("tipReturned")}
              value={formatMoney(data.totals.returned)}
            />
            <StatCard
              label={t("tipOwed")}
              value={formatMoney(data.totals.tipOwed)}
            />
          </section>

          <section
            aria-label={t("tipPayoutTitle")}
            className="space-y-3 rounded-2xl border border-border/70 bg-card p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{t("tipPayoutTitle")}</h3>
              {data.payout.overdueWaiters > 0 ? (
                <Badge variant="destructive">
                  {t("tipOverdueWaiters", { count: data.payout.overdueWaiters })}
                </Badge>
              ) : null}
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("colCardPending")}
                </dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {formatMoney(data.payout.cardTipPending)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("colCardOverdue")}
                </dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {formatMoney(data.payout.cardTipOverdue)}
                </dd>
              </div>
            </dl>
            <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {t("tipPayoutNote", {
                days: data.payout.businessDays,
                date: formatDateKey(data.payout.asOf, locale),
              })}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">{t("tipByWaiter")}</h3>
            {data.byWaiter.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("emptyDescription")}</p>
            ) : (
              <DataList
                label={t("tipByWaiter")}
                columns={waiterColumns}
                rows={data.byWaiter}
                rowKey={(row) => row.staffId ?? row.name}
                rowClassName={(row) =>
                  row.payoutStatus === "OVERDUE"
                    ? "border-destructive/40"
                    : undefined
                }
              />
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">{t("tipByDay")}</h3>
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <BarChart
                data={data.byDay.map((row) => ({
                  label: row.date.slice(8),
                  hint: `${formatDateKey(row.date, locale)} · ${formatPercent(row.tipPercent, locale)}`,
                  value: Math.max(0, Number(row.tip)),
                }))}
                formatValue={(value) => compact.format(value)}
                emptyLabel={t("emptyTitle")}
              />
            </div>
            {data.byDay.length > 0 ? (
              <DataList
                label={t("tipByDay")}
                columns={dayColumns}
                rows={data.byDay}
                rowKey={(row) => row.date}
              />
            ) : null}
          </section>
        </div>
      ) : null}
    </ReportQueryState>
  );
}
