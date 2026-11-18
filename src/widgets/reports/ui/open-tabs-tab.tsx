"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { reportsApi, retryReportRequest } from "@/shared/api/reports-api";
import { formatMoney } from "@/shared/lib/format";
import { StatCard } from "@/shared/ui/stat-card";
import {
  OPEN_TAB_KINDS,
  type OpenTabKind,
  type OpenTabRow,
  type ReportFilters,
} from "@/shared/types/reports";
import { DataList, type DataColumn } from "./data-list";
import { OrderDetailDialog } from "./order-detail-dialog";
import { ReportQueryState, ToggleGroup } from "./report-parts";
import { formatReportDateTime, type DateRange } from "./report-range";

type OpenTabsTabProps = {
  token: string | null;
  branchId: string;
  range: DateRange;
  filters: ReportFilters;
  enabled: boolean;
  kind: OpenTabKind;
  isFiltered: boolean;
  onClearFilters: () => void;
  onKindChange: (kind: OpenTabKind) => void;
};

const MINUTES_PER_HOUR = 60;

function AgeBadge({ row }: { row: OpenTabRow }) {
  const t = useTranslations("Reports");
  const hours = Math.floor(row.ageMinutes / MINUTES_PER_HOUR);
  const minutes = row.ageMinutes % MINUTES_PER_HOUR;

  return (
    <Badge
      variant={row.alert ? "destructive" : "secondary"}
      className="tabular-nums"
    >
      <Clock aria-hidden="true" />
      {hours > 0 ? t("ageHours", { hours, minutes }) : t("ageMinutes", { minutes })}
      {row.alert ? <span className="sr-only">{t("openTabsAlert")}</span> : null}
    </Badge>
  );
}

export function OpenTabsTab({
  token,
  branchId,
  range,
  filters,
  enabled,
  kind,
  isFiltered,
  onClearFilters,
  onKindChange,
}: OpenTabsTabProps) {
  const t = useTranslations("Reports");
  const locale = useLocale();
  const [selected, setSelected] = useState<OpenTabRow | null>(null);
  const rangeKey = kind === "open" ? null : range;
  const query = useQuery({
    queryKey: ["reports", "open-tabs", branchId, kind, rangeKey, filters],
    enabled: enabled && Boolean(token),
    placeholderData: keepPreviousData,
    retry: retryReportRequest,
    queryFn: () =>
      reportsApi.getOpenTabs(token!, branchId, { ...range, filters }, kind),
  });
  const data = query.data;
  const showCancelled = kind === "cancelled";

  const columns: DataColumn<OpenTabRow>[] = [
    {
      id: "order",
      label: t("colOrder"),
      cell: (row) => (
        <span>
          #{row.orderNumber}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {row.table}
            {row.zone ? ` · ${row.zone}` : ""}
          </span>
        </span>
      ),
    },
    {
      id: "age",
      label: t("colAge"),
      cell: (row) => <AgeBadge row={row} />,
    },
    {
      id: "waiter",
      label: t("colWaiter"),
      cell: (row) => row.waiter ?? "—",
    },
    {
      id: "guests",
      label: t("colGuests"),
      align: "right",
      cell: (row) => row.guests ?? "—",
    },
    {
      id: "openedAt",
      label: t("colOpenedAt"),
      cell: (row) => formatReportDateTime(row.openedAt, locale),
    },
    ...(kind === "open"
      ? []
      : [
          {
            id: "endedAt",
            label: t("colEndedAt"),
            cell: (row: OpenTabRow) =>
              row.endedAt ? formatReportDateTime(row.endedAt, locale) : "—",
          },
        ]),
    {
      id: "total",
      label: t("colTotal"),
      align: "right",
      cell: (row) => formatMoney(row.total),
    },
    {
      id: "paid",
      label: t("colPaid"),
      align: "right",
      cell: (row) => formatMoney(row.paid),
    },
    {
      id: "pending",
      label: t("colPending"),
      align: "right",
      cell: (row) => formatMoney(row.pending),
    },
    ...(showCancelled
      ? [
          {
            id: "cancelledOrders",
            label: t("colCancelledOrders"),
            align: "right" as const,
            cell: (row: OpenTabRow) => row.cancelledOrders ?? 0,
          },
          {
            id: "cancelledAmount",
            label: t("colCancelledAmount"),
            align: "right" as const,
            cell: (row: OpenTabRow) => formatMoney(row.cancelledAmount ?? 0),
          },
        ]
      : []),
    ...(kind === "abandoned"
      ? [
          {
            id: "closeReason",
            label: t("colCloseReason"),
            cell: (row: OpenTabRow) => row.closeReason ?? "—",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <ToggleGroup
        label={t("openTabsKindLabel")}
        options={OPEN_TAB_KINDS.map((value) => ({
          value,
          label: t(`openTabsKinds.${value}`),
        }))}
        value={kind}
        onChange={onKindChange}
      />
      <p className="text-sm text-muted-foreground">
        {t(`openTabsHelp.${kind}`, { hours: (data?.alertAfterMinutes ?? 180) / 60 })}
      </p>
      <ReportQueryState
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={(data?.rows.length ?? 0) === 0}
        isRefreshing={query.isPlaceholderData}
        isFiltered={isFiltered}
        onClearFilters={onClearFilters}
        onRetry={() => void query.refetch()}
      >
        {data ? (
          <div className="space-y-4">
            <section
              aria-label={t("statsAria")}
              className="grid grid-cols-2 gap-4 xl:grid-cols-3"
            >
              <StatCard
                label={t("openTabsCount")}
                value={String(data.totals.count)}
              />
              <StatCard
                label={t("colPending")}
                value={formatMoney(data.totals.pending)}
              />
              {kind === "open" ? (
                <StatCard
                  label={t("openTabsAlerts", {
                    hours: data.alertAfterMinutes / 60,
                  })}
                  value={String(data.totals.alerts)}
                />
              ) : null}
            </section>
            {data.truncated ? (
              <p role="status" className="text-sm text-muted-foreground">
                {t("openTabsTruncated", { count: data.rows.length })}
              </p>
            ) : null}
            <DataList
              label={t(`openTabsKinds.${kind}`)}
              columns={columns}
              rows={data.rows}
              rowKey={(row) => row.sessionId}
              onSelect={(row) => {
                if (row.billId) {
                  setSelected(row);
                }
              }}
              rowClassName={(row) =>
                row.alert ? "border-destructive/50" : undefined
              }
            />
          </div>
        ) : null}
      </ReportQueryState>
      <OrderDetailDialog
        token={token}
        branchId={branchId}
        billId={selected?.billId ?? null}
        orderNumber={selected?.orderNumber ?? null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
