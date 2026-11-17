"use client";

import { useState } from "react";
import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney } from "@/shared/lib/format";
import type { PaymentsReportResponse, PaymentsReportRow } from "@/shared/types/reports";
import { formatReportDateTime } from "./report-range";
import { DetailGrid, LoadMore, ReportQueryState } from "./report-parts";
import { BodyCell, HeadCell, SelectableRow } from "./report-table";

type PaymentsTabProps = {
  query: UseInfiniteQueryResult<InfiniteData<PaymentsReportResponse>, Error>;
};

const FAILED_STATUSES = ["FAILED", "CANCELLED"];

export function PaymentsTab({ query }: PaymentsTabProps) {
  const t = useTranslations("Reports");
  const locale = useLocale();
  const [selected, setSelected] = useState<PaymentsReportRow | null>(null);

  const pages = query.data?.pages ?? [];
  const rows = pages.flatMap((page) => page.rows);
  const totals = pages[0]?.totals;

  const statusLabel = (status: string) =>
    t.has(`paymentStatus.${status}`) ? t(`paymentStatus.${status}`) : status;

  const methodLabel = (row: PaymentsReportRow) =>
    row.method
      ? t(`methods.${row.method}`)
      : row.kind === "ATTEMPT"
        ? "—"
        : t("methods.SIN_CLASIFICAR");

  const sourceLabel = (row: PaymentsReportRow) =>
    row.source ? t(`sources.${row.source}`) : "—";

  const statusBadge = (row: PaymentsReportRow) => (
    <Badge
      variant={
        FAILED_STATUSES.includes(row.status)
          ? "destructive"
          : row.status === "PAID"
            ? "outline"
            : "secondary"
      }
    >
      {statusLabel(row.status)}
    </Badge>
  );

  return (
    <ReportQueryState
      isLoading={query.isLoading}
      isError={query.isError}
      isEmpty={rows.length === 0}
      onRetry={() => void query.refetch()}
    >
      <div className="space-y-4">
        {totals ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <SummaryList
              title={t("summaryByStatus")}
              items={totals.byStatus.map((entry) => ({
                key: entry.status,
                label: statusLabel(entry.status),
                count: entry.count,
                amount: entry.amount,
              }))}
            />
            <SummaryList
              title={t("summaryByMethod")}
              items={totals.byMethod.map((entry) => ({
                key: entry.method,
                label: t(`methods.${entry.method}`),
                count: entry.count,
                amount: entry.amount,
              }))}
            />
          </div>
        ) : null}

        <div className="hidden max-h-[65vh] overflow-auto rounded-2xl border border-border/70 bg-card md:block">
          <table className="w-full border-separate border-spacing-0 text-sm tabular-nums">
            <thead>
              <tr>
                <HeadCell>{t("colDate")}</HeadCell>
                <HeadCell>{t("colKind")}</HeadCell>
                <HeadCell>{t("colOrder")}</HeadCell>
                <HeadCell>{t("colTable")}</HeadCell>
                <HeadCell>{t("colMethod")}</HeadCell>
                <HeadCell>{t("colProvider")}</HeadCell>
                <HeadCell>{t("colStatus")}</HeadCell>
                <HeadCell align="right">{t("colAmount")}</HeadCell>
                <HeadCell align="right">{t("colTip")}</HeadCell>
                <HeadCell align="right">{t("colCharged")}</HeadCell>
                <HeadCell>{t("colCaja")}</HeadCell>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <SelectableRow
                  key={`${row.kind}-${row.id}`}
                  onSelect={() => setSelected(row)}
                >
                  <BodyCell>{formatReportDateTime(row.paidAt ?? row.createdAt, locale)}</BodyCell>
                  <BodyCell>{t(`kinds.${row.kind}`)}</BodyCell>
                  <BodyCell className="font-medium">
                    {row.orderNumber ? `#${row.orderNumber}` : "—"}
                  </BodyCell>
                  <BodyCell>{row.table ?? "—"}</BodyCell>
                  <BodyCell>{methodLabel(row)}</BodyCell>
                  <BodyCell>{row.provider}</BodyCell>
                  <BodyCell>{statusBadge(row)}</BodyCell>
                  <BodyCell align="right">{formatMoney(row.amount)}</BodyCell>
                  <BodyCell align="right">{formatMoney(row.tip)}</BodyCell>
                  <BodyCell align="right" className="font-medium">
                    {formatMoney(row.total)}
                  </BodyCell>
                  <BodyCell>{row.caja}</BodyCell>
                </SelectableRow>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="space-y-3 md:hidden">
          {rows.map((row) => (
            <li key={`${row.kind}-${row.id}`}>
              <button
                type="button"
                className="w-full cursor-pointer rounded-2xl border border-border/70 bg-card p-4 text-left shadow-sm"
                onClick={() => setSelected(row)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {row.orderNumber ? `#${row.orderNumber}` : t(`kinds.${row.kind}`)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatReportDateTime(row.paidAt ?? row.createdAt, locale)}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {methodLabel(row)} · {row.provider} · {row.caja}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums">
                      {formatMoney(row.total)}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {t("colTip")}: {formatMoney(row.tip)}
                    </p>
                  </div>
                </div>
                <div className="mt-3">{statusBadge(row)}</div>
              </button>
            </li>
          ))}
        </ul>

        <LoadMore
          hasNextPage={Boolean(query.hasNextPage)}
          isFetching={query.isFetchingNextPage}
          onLoadMore={() => void query.fetchNextPage()}
        />
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t("detailPaymentTitle", { kind: t(`kinds.${selected.kind}`) })}
                </DialogTitle>
                <DialogDescription>
                  {formatReportDateTime(selected.paidAt ?? selected.createdAt, locale)}
                </DialogDescription>
              </DialogHeader>
              <DetailGrid
                items={[
                  [t("colOrder"), selected.orderNumber ? `#${selected.orderNumber}` : "—"],
                  [t("colTable"), selected.table ?? "—"],
                  [t("colMethod"), methodLabel(selected)],
                  [t("colProvider"), selected.provider],
                  [t("colReference"), selected.providerReference ?? "—"],
                  [t("colStatus"), statusLabel(selected.status)],
                  [t("colProviderStatus"), selected.providerStatus ?? "—"],
                  [t("colProviderDetail"), selected.providerStatusDetail ?? "—"],
                  [t("colFailureReason"), selected.failureReason ?? "—"],
                  [t("colAmount"), formatMoney(selected.amount)],
                  [t("colTip"), formatMoney(selected.tip)],
                  [t("colCharged"), formatMoney(selected.total)],
                  [t("colCaja"), selected.caja],
                  [t("colCashier"), selected.cashier ?? "—"],
                  [t("colSource"), sourceLabel(selected)],
                  [t("colRefunded"), formatMoney(selected.refunded)],
                ]}
              />
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </ReportQueryState>
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
