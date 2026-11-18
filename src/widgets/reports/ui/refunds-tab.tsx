"use client";

import { useState } from "react";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reportsApi, retryReportRequest } from "@/shared/api/reports-api";
import { formatMoney } from "@/shared/lib/format";
import {
  REFUND_METHODS,
  REFUND_REASON_CODES,
  REFUND_STATUSES,
  type RefundsReportRow,
} from "@/shared/types/refunds";
import type { ReportFilters, ReportSort } from "@/shared/types/reports";
import { DataList, type DataColumn } from "./data-list";
import { OrderDetailDialog } from "./order-detail-dialog";
import { LoadMore, ReportQueryState } from "./report-parts";
import { formatReportDateTime, type DateRange } from "./report-range";
import {
  refundChipExtra,
  type RefundChips,
} from "./report-tabs";

type RefundsTabProps = {
  token: string | null;
  branchId: string;
  range: DateRange;
  filters: ReportFilters;
  sort: ReportSort;
  chips: RefundChips;
  enabled: boolean;
  isFiltered: boolean;
  onClearFilters: () => void;
  onChipsChange: (patch: Partial<RefundChips>) => void;
};

const PAGE_SIZE = 50;

const STATUS_VARIANTS = {
  SUCCEEDED: "outline",
  PENDING: "secondary",
  FAILED: "destructive",
  REQUIRES_MANUAL_REVIEW: "destructive",
} as const;

function toggled(current: string, order: readonly string[], value: string) {
  const selected = current.split(",").filter(Boolean);
  const next = selected.includes(value)
    ? selected.filter((entry) => entry !== value)
    : [...selected, value];

  return order.filter((entry) => next.includes(entry)).join(",");
}

export function RefundsTab({
  token,
  branchId,
  range,
  filters,
  sort,
  chips,
  enabled,
  isFiltered,
  onClearFilters,
  onChipsChange,
}: RefundsTabProps) {
  const t = useTranslations("Reports");
  const tRefunds = useTranslations("Refunds");
  const locale = useLocale();
  const [detail, setDetail] = useState<{ id: string; number: string } | null>(
    null
  );
  const query = useInfiniteQuery({
    queryKey: [
      "reports",
      "refunds",
      branchId,
      range.from,
      range.to,
      filters,
      sort,
      chips,
    ],
    enabled: enabled && Boolean(token),
    placeholderData: keepPreviousData,
    retry: retryReportRequest,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      reportsApi.getRefunds(
        token!,
        branchId,
        {
          ...range,
          filters,
          sort,
          cursor: pageParam,
          limit: PAGE_SIZE,
        },
        refundChipExtra(chips)
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const pages = query.data?.pages ?? [];
  const rows = pages.flatMap((page) => page.rows);
  const totals = pages[0]?.totals;
  const chipsActive = Object.values(chips).some(Boolean);

  const reasonLabel = (code: string) =>
    tRefunds.has(`reasons.${code}`) ? tRefunds(`reasons.${code}`) : code;
  const methodLabel = (method: string) =>
    t.has(`methods.${method}`) ? t(`methods.${method}`) : method;

  const columns: DataColumn<RefundsReportRow>[] = [
    {
      id: "date",
      label: t("colDate"),
      cell: (row) =>
        row.completedAt ? formatReportDateTime(row.completedAt, locale) : "—",
      foot: t("refundsTotalRow", { count: totals?.count ?? 0 }),
    },
    {
      id: "order",
      label: t("colOrder"),
      cell: (row) => (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          #{row.orderNumber}
          {row.billHasActiveOrders ? (
            <Badge variant="secondary">{t("refundActiveOrders")}</Badge>
          ) : null}
        </span>
      ),
    },
    { id: "table", label: t("colTable"), cell: (row) => row.table ?? "—" },
    {
      id: "method",
      label: t("colMethod"),
      cell: (row) => methodLabel(row.paymentMethod),
    },
    {
      id: "reason",
      label: t("colReason"),
      cell: (row) => (
        <span className="inline-block max-w-56 truncate align-bottom" title={row.reasonText}>
          {reasonLabel(row.reasonCode)}
          {row.reasonText ? ` · ${row.reasonText}` : ""}
        </span>
      ),
    },
    {
      id: "requestedBy",
      label: t("colRequestedBy"),
      cell: (row) =>
        row.approvedBy
          ? `${row.requestedBy ?? "—"} (${t("refundApprovedBy", { name: row.approvedBy })})`
          : (row.requestedBy ?? "—"),
    },
    {
      id: "amount",
      label: t("colAmount"),
      align: "right",
      cell: (row) => formatMoney(row.amount),
      foot: totals ? formatMoney(totals.amount) : undefined,
    },
    {
      id: "tip",
      label: t("colTip"),
      align: "right",
      cell: (row) => formatMoney(row.tip),
      foot: totals ? formatMoney(totals.tip) : undefined,
    },
    {
      id: "net",
      label: t("colNet"),
      align: "right",
      cell: (row) => formatMoney(row.net),
      foot: totals ? formatMoney(totals.net) : undefined,
    },
    {
      id: "vat",
      label: t("colVat"),
      align: "right",
      cell: (row) => formatMoney(row.vat),
      foot: totals ? formatMoney(totals.vat) : undefined,
    },
    {
      id: "refundMethod",
      label: t("colRefundMethod"),
      cell: (row) => t(`refundMethods.${row.refundMethod}`),
    },
    {
      id: "status",
      label: t("colStatus"),
      cell: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status]}>
          {t(`refundStatuses.${row.status}`)}
        </Badge>
      ),
    },
    {
      id: "creditNote",
      label: t("colCreditNote"),
      cell: (row) =>
        t.has(`orderDetail.creditNote.${row.creditNoteStatus}`)
          ? t(`orderDetail.creditNote.${row.creditNoteStatus}`)
          : row.creditNoteStatus,
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <ChipGroup
          label={t("refundChipsReason")}
          values={REFUND_REASON_CODES}
          selected={chips.reasonCode}
          labelOf={reasonLabel}
          onToggle={(value) =>
            onChipsChange({
              reasonCode: toggled(chips.reasonCode, REFUND_REASON_CODES, value),
            })
          }
        />
        <div className="grid gap-3 md:grid-cols-2">
          <ChipGroup
            label={t("refundChipsStatus")}
            values={REFUND_STATUSES}
            selected={chips.refundStatus}
            labelOf={(value) => t(`refundStatuses.${value}`)}
            onToggle={(value) =>
              onChipsChange({
                refundStatus: toggled(chips.refundStatus, REFUND_STATUSES, value),
              })
            }
          />
          <ChipGroup
            label={t("refundChipsMethod")}
            values={REFUND_METHODS}
            selected={chips.refundMethod}
            labelOf={(value) => t(`refundMethods.${value}`)}
            onToggle={(value) =>
              onChipsChange({
                refundMethod: toggled(chips.refundMethod, REFUND_METHODS, value),
              })
            }
          />
        </div>
        {chipsActive ? (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() =>
              onChipsChange({
                reasonCode: "",
                refundStatus: "",
                refundMethod: "",
              })
            }
          >
            {t("refundChipsClear")}
          </Button>
        ) : null}

        <ReportQueryState
          isLoading={query.isLoading}
          isError={query.isError}
          isEmpty={rows.length === 0}
          isRefreshing={query.isPlaceholderData}
          isFiltered={isFiltered || chipsActive}
          onClearFilters={onClearFilters}
          onRetry={() => void query.refetch()}
        >
          <div className="space-y-4">
            {totals ? (
              <div className="grid gap-3 lg:grid-cols-3">
                <SummaryList
                  title={t("refundsByMethod")}
                  items={totals.byMethod.map((entry) => ({
                    key: entry.method,
                    label: methodLabel(entry.method),
                    count: entry.count,
                    amount: entry.amount,
                  }))}
                />
                <SummaryList
                  title={t("refundsByReason")}
                  items={totals.byReason.map((entry) => ({
                    key: entry.reasonCode,
                    label: reasonLabel(entry.reasonCode),
                    count: entry.count,
                    amount: entry.amount,
                  }))}
                />
                <SummaryList
                  title={t("refundsByRequester")}
                  items={totals.byRequester.map((entry) => ({
                    key: entry.staffUserId ?? "none",
                    label: entry.name ?? "—",
                    count: entry.count,
                    amount: entry.amount,
                  }))}
                />
              </div>
            ) : null}

            <DataList
              label={t("tabRefunds")}
              columns={columns}
              rows={rows}
              rowKey={(row) => row.refundId}
              hasFoot
              onSelect={(row) =>
                setDetail({ id: row.billId, number: row.orderNumber })
              }
            />

            <LoadMore
              hasNextPage={Boolean(query.hasNextPage)}
              isFetching={query.isFetchingNextPage}
              onLoadMore={() => void query.fetchNextPage()}
            />
          </div>
        </ReportQueryState>
      </div>
      <OrderDetailDialog
        token={token}
        branchId={branchId}
        billId={detail?.id ?? null}
        orderNumber={detail?.number ?? null}
        onClose={() => setDetail(null)}
      />
    </>
  );
}

type ChipGroupProps = {
  label: string;
  values: readonly string[];
  selected: string;
  labelOf: (value: string) => string;
  onToggle: (value: string) => void;
};

function ChipGroup({
  label,
  values,
  selected,
  labelOf,
  onToggle,
}: ChipGroupProps) {
  const active = selected.split(",").filter(Boolean);

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {values.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={active.includes(value) ? "default" : "outline"}
            className="rounded-full"
            aria-pressed={active.includes(value)}
            onClick={() => onToggle(value)}
          >
            {labelOf(value)}
          </Button>
        ))}
      </div>
    </div>
  );
}

type SummaryListProps = {
  title: string;
  items: Array<{ key: string; label: string; count: number; amount: string }>;
};

function SummaryList({ title, items }: SummaryListProps) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item.key}
            className="rounded-xl bg-muted px-3 py-1.5 text-xs tabular-nums"
          >
            <span className="font-medium">{item.label}</span> · {item.count} ·{" "}
            {formatMoney(item.amount)}
          </li>
        ))}
      </ul>
    </section>
  );
}
