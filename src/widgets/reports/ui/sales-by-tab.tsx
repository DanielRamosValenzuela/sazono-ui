"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { reportsApi, retryReportRequest } from "@/shared/api/reports-api";
import { formatMoney } from "@/shared/lib/format";
import { BarChart } from "@/shared/ui/charts";
import {
  SALES_BY_VIEWS,
  TIME_BUCKETS,
  type ReportFilters,
  type SalesByMethodRow,
  type SalesByStaffResponse,
  type SalesByStaffRow,
  type SalesByTimeRow,
  type SalesByView,
  type TimeBucket,
} from "@/shared/types/reports";
import { DataList, type DataColumn } from "./data-list";
import { negativeClass } from "./report-format";
import { ReportQueryState, ShareCell, ToggleGroup } from "./report-parts";
import type { DateRange } from "./report-range";
import { TimeHeatmap } from "./time-heatmap";

export const CASHIER_SALES_BY_VIEWS: readonly SalesByView[] = [
  "method",
  "cashier",
  "time",
];

type SalesByTabProps = {
  token: string | null;
  branchId: string;
  range: DateRange;
  filters: ReportFilters;
  enabled: boolean;
  fullAccess: boolean;
  view: SalesByView;
  bucket: TimeBucket;
  isFiltered: boolean;
  onClearFilters: () => void;
  onViewChange: (view: SalesByView) => void;
  onBucketChange: (bucket: TimeBucket) => void;
};

type ViewProps = Pick<
  SalesByTabProps,
  | "token"
  | "branchId"
  | "range"
  | "filters"
  | "enabled"
  | "isFiltered"
  | "onClearFilters"
>;

function Money({ value }: { value: string }) {
  return <span className={negativeClass(value)}>{formatMoney(value)}</span>;
}

function MethodView({
  token,
  branchId,
  range,
  filters,
  enabled,
  isFiltered,
  onClearFilters,
}: ViewProps) {
  const t = useTranslations("Reports");
  const query = useQuery({
    queryKey: [
      "reports",
      "sales-by-method",
      branchId,
      range.from,
      range.to,
      filters,
    ],
    enabled: enabled && Boolean(token),
    placeholderData: keepPreviousData,
    retry: retryReportRequest,
    queryFn: () =>
      reportsApi.getSalesByMethod(token!, branchId, { ...range, filters }),
  });
  const data = query.data;
  const totals = data?.totals;

  const columns: DataColumn<SalesByMethodRow>[] = [
    {
      id: "method",
      label: t("colMethod"),
      cell: (row) => t(`methods.${row.method}`),
      foot: t("hierarchyTotal"),
    },
    {
      id: "count",
      label: t("colPaymentsCount"),
      align: "right",
      cell: (row) => row.count,
      foot: totals?.count,
    },
    {
      id: "bills",
      label: t("colBills"),
      align: "right",
      cell: (row) => row.bills,
    },
    {
      id: "amount",
      label: t("colAmount"),
      align: "right",
      cell: (row) => formatMoney(row.amount),
      foot: totals ? formatMoney(totals.amount) : null,
    },
    {
      id: "tip",
      label: t("colTip"),
      align: "right",
      cell: (row) => formatMoney(row.tip),
      foot: totals ? formatMoney(totals.tip) : null,
    },
    {
      id: "refunded",
      label: t("colRefunded"),
      align: "right",
      cell: (row) => formatMoney(row.refunded),
      foot: totals ? formatMoney(totals.refunded) : null,
    },
    {
      id: "net",
      label: t("colNet"),
      align: "right",
      cell: (row) => <Money value={row.net} />,
      foot: totals ? <Money value={totals.net} /> : null,
    },
    {
      id: "share",
      label: t("colShare"),
      align: "right",
      cell: (row) => <ShareCell share={row.share} />,
    },
  ];

  return (
    <ReportQueryState
      isLoading={query.isLoading}
      isError={query.isError}
      isEmpty={(data?.rows.length ?? 0) === 0}
      isRefreshing={query.isPlaceholderData}
      isFiltered={isFiltered}
      onClearFilters={onClearFilters}
      onRetry={() => void query.refetch()}
    >
      <DataList
        label={t("salesByViews.method")}
        columns={columns}
        rows={data?.rows ?? []}
        rowKey={(row) => row.method}
        hasFoot
      />
    </ReportQueryState>
  );
}

function StaffView({
  role,
  token,
  branchId,
  range,
  filters,
  enabled,
  isFiltered,
  onClearFilters,
}: ViewProps & { role: SalesByStaffResponse["role"] }) {
  const t = useTranslations("Reports");
  const query = useQuery({
    queryKey: [
      "reports",
      "sales-by-staff",
      branchId,
      range.from,
      range.to,
      filters,
      role,
    ],
    enabled: enabled && Boolean(token),
    placeholderData: keepPreviousData,
    retry: retryReportRequest,
    queryFn: () =>
      reportsApi.getSalesByStaff(token!, branchId, { ...range, filters }, role),
  });
  const data = query.data;
  const totals = data?.totals;

  const columns: DataColumn<SalesByStaffRow>[] = [
    {
      id: "name",
      label: t(role === "waiter" ? "colWaiter" : "colCashier"),
      cell: (row) => row.name,
      foot: t("hierarchyTotal"),
    },
    {
      id: "bills",
      label: t("colBills"),
      align: "right",
      cell: (row) => row.bills,
      foot: totals?.bills,
    },
    {
      id: "guests",
      label: t("colGuests"),
      align: "right",
      cell: (row) => row.guests,
      foot: totals?.guests,
    },
    {
      id: "amount",
      label: t("colAmount"),
      align: "right",
      cell: (row) => formatMoney(row.amount),
      foot: totals ? formatMoney(totals.amount) : null,
    },
    {
      id: "refunded",
      label: t("colRefunded"),
      align: "right",
      cell: (row) => formatMoney(row.refunded),
      foot: totals ? formatMoney(totals.refunded) : null,
    },
    {
      id: "net",
      label: t("colNet"),
      align: "right",
      cell: (row) => <Money value={row.net} />,
      foot: totals ? <Money value={totals.net} /> : null,
    },
    {
      id: "averageTicket",
      label: t("colAverageTicket"),
      align: "right",
      cell: (row) => formatMoney(row.averageTicket),
      foot: totals ? formatMoney(totals.averageTicket) : null,
    },
    {
      id: "tip",
      label: t("colTip"),
      align: "right",
      cell: (row) => formatMoney(row.tip),
      foot: totals ? formatMoney(totals.tip) : null,
    },
    {
      id: "tipPerBill",
      label: t("colTipPerBill"),
      align: "right",
      cell: (row) => formatMoney(row.tipPerBill),
      foot: totals ? formatMoney(totals.tipPerBill) : null,
    },
  ];

  return (
    <ReportQueryState
      isLoading={query.isLoading}
      isError={query.isError}
      isEmpty={(data?.rows.length ?? 0) === 0}
      isRefreshing={query.isPlaceholderData}
      isFiltered={isFiltered}
      onClearFilters={onClearFilters}
      onRetry={() => void query.refetch()}
    >
      <DataList
        label={t(`salesByViews.${role}`)}
        columns={columns}
        rows={data?.rows ?? []}
        rowKey={(row) => row.staffId ?? row.name}
        hasFoot
      />
    </ReportQueryState>
  );
}

function TimeView({
  bucket,
  onBucketChange,
  token,
  branchId,
  range,
  filters,
  enabled,
  isFiltered,
  onClearFilters,
}: ViewProps & {
  bucket: TimeBucket;
  onBucketChange: (bucket: TimeBucket) => void;
}) {
  const t = useTranslations("Reports");
  const locale = useLocale();
  const query = useQuery({
    queryKey: [
      "reports",
      "sales-by-time",
      branchId,
      range.from,
      range.to,
      filters,
      bucket,
    ],
    enabled: enabled && Boolean(token),
    placeholderData: keepPreviousData,
    retry: retryReportRequest,
    queryFn: () =>
      reportsApi.getSalesByTime(token!, branchId, { ...range, filters }, bucket),
  });
  const data = query.data;
  const totals = data?.totals;
  const compact = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const bucketName = t(`buckets.${bucket}`);

  const periodLabel = (row: SalesByTimeRow) =>
    bucket === "weekday" ? t(`filters.weekdayLong.${row.key}`) : row.label;

  const chartLabel = (row: SalesByTimeRow) => {
    switch (bucket) {
      case "weekday":
        return t(`filters.weekdayShort.${row.key}`);
      case "day":
        return row.key.slice(8);
      case "month":
        return row.key.slice(5);
      default:
        return row.key;
    }
  };

  const columns: DataColumn<SalesByTimeRow>[] = [
    {
      id: "period",
      label: t("colPeriod"),
      cell: periodLabel,
      foot: t("hierarchyTotal"),
    },
    {
      id: "bills",
      label: t("colBills"),
      align: "right",
      cell: (row) => row.bills,
      foot: totals?.bills,
    },
    {
      id: "guests",
      label: t("colGuests"),
      align: "right",
      cell: (row) => row.guests,
      foot: totals?.guests,
    },
    {
      id: "amount",
      label: t("colAmount"),
      align: "right",
      cell: (row) => formatMoney(row.amount),
      foot: totals ? formatMoney(totals.amount) : null,
    },
    {
      id: "refunded",
      label: t("colRefunded"),
      align: "right",
      cell: (row) => formatMoney(row.refunded),
      foot: totals ? formatMoney(totals.refunded) : null,
    },
    {
      id: "net",
      label: t("colNet"),
      align: "right",
      cell: (row) => <Money value={row.net} />,
      foot: totals ? <Money value={totals.net} /> : null,
    },
    {
      id: "averageTicket",
      label: t("colAverageTicket"),
      align: "right",
      cell: (row) => formatMoney(row.averageTicket),
      foot: totals ? formatMoney(totals.averageTicket) : null,
    },
    {
      id: "tip",
      label: t("colTip"),
      align: "right",
      cell: (row) => formatMoney(row.tip),
      foot: totals ? formatMoney(totals.tip) : null,
    },
  ];

  const hasSales = (data?.rows ?? []).some(
    (row) => row.bills > 0 || Number(row.net) !== 0
  );

  return (
    <div className="space-y-4">
      <ToggleGroup
        label={t("bucketLabel")}
        options={TIME_BUCKETS.map((value) => ({
          value,
          label: t(`buckets.${value}`),
        }))}
        value={bucket}
        onChange={onBucketChange}
      />
      <ReportQueryState
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={!hasSales}
        isRefreshing={query.isPlaceholderData}
        isFiltered={isFiltered}
        onClearFilters={onClearFilters}
        onRetry={() => void query.refetch()}
      >
        <div className="space-y-6">
          {data?.heatmap ? <TimeHeatmap heatmap={data.heatmap} /> : null}

          <section
            aria-label={t("chartTitle", { bucket: bucketName })}
            className="space-y-2 rounded-2xl border border-border/70 bg-card p-4"
          >
            <h3 className="text-sm font-semibold">
              {t("chartTitle", { bucket: bucketName })}
            </h3>
            <BarChart
              data={(data?.rows ?? []).map((row) => ({
                label: chartLabel(row),
                hint: `${periodLabel(row)} · ${t("heatmap.bills", { count: row.bills })}`,
                value: Math.max(0, Number(row.net)),
              }))}
              formatValue={(value) => compact.format(value)}
              emptyLabel={t("emptyTitle")}
            />
          </section>

          <DataList
            label={bucketName}
            columns={columns}
            rows={data?.rows ?? []}
            rowKey={(row) => row.key}
            hasFoot
          />
        </div>
      </ReportQueryState>
    </div>
  );
}

export function SalesByTab({
  fullAccess,
  view,
  bucket,
  onViewChange,
  onBucketChange,
  ...scope
}: SalesByTabProps) {
  const t = useTranslations("Reports");
  const views = SALES_BY_VIEWS.filter(
    (entry) => fullAccess || CASHIER_SALES_BY_VIEWS.includes(entry)
  );

  return (
    <div className="space-y-4">
      <ToggleGroup
        label={t("salesByLabel")}
        options={views.map((value) => ({
          value,
          label: t(`salesByViews.${value}`),
        }))}
        value={view}
        onChange={onViewChange}
      />
      {view === "method" ? <MethodView {...scope} /> : null}
      {view === "waiter" || view === "cashier" ? (
        <StaffView {...scope} role={view} />
      ) : null}
      {view === "time" ? (
        <TimeView {...scope} bucket={bucket} onBucketChange={onBucketChange} />
      ) : null}
    </div>
  );
}
