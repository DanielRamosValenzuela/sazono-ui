"use client";

import { useState } from "react";
import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { Columns3 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/shared/lib/format";
import { CheckboxRow } from "@/shared/ui/form-controls";
import {
  REPORT_METHOD_KEYS,
  type ReportMethodAmount,
  type ReportMethodKey,
  type SalesByOrderResponse,
  type SalesByOrderRow,
} from "@/shared/types/reports";
import { formatReportDateTime } from "./report-range";
import { DetailGrid, LoadMore, ReportQueryState } from "./report-parts";
import { BodyCell, FootCell, HeadCell, SelectableRow } from "./report-table";

type SalesTabProps = {
  query: UseInfiniteQueryResult<InfiniteData<SalesByOrderResponse>, Error>;
};

const STATUS_KEYS = { Pagado: "paid", Mixto: "mixed" } as const;

function amountOf(methods: ReportMethodAmount[], key: ReportMethodKey) {
  return methods.find((entry) => entry.method === key)?.amount ?? "0";
}

function isZero(amount: string) {
  return Number(amount) === 0;
}

export function SalesTab({ query }: SalesTabProps) {
  const t = useTranslations("Reports");
  const locale = useLocale();
  const [hiddenMethods, setHiddenMethods] = useState<ReportMethodKey[]>([]);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [selected, setSelected] = useState<SalesByOrderRow | null>(null);

  const pages = query.data?.pages ?? [];
  const rows = pages.flatMap((page) => page.rows);
  const totals = pages[0]?.totals;
  const visibleMethods = REPORT_METHOD_KEYS.filter(
    (key) => !hiddenMethods.includes(key)
  );

  const toggleMethod = (key: ReportMethodKey) =>
    setHiddenMethods((current) =>
      current.includes(key)
        ? current.filter((entry) => entry !== key)
        : [...current, key]
    );

  const statusLabel = (row: SalesByOrderRow) =>
    t(`salesStatus.${STATUS_KEYS[row.paymentStatus]}`);

  return (
    <ReportQueryState
      isLoading={query.isLoading}
      isError={query.isError}
      isEmpty={rows.length === 0}
      onRetry={() => void query.refetch()}
    >
      <div className="space-y-3">
        <div className="hidden justify-end md:flex">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            aria-expanded={columnsOpen}
            onClick={() => setColumnsOpen((open) => !open)}
          >
            <Columns3 />
            {t("columns")}
          </Button>
        </div>

        {columnsOpen ? (
          <div className="hidden flex-wrap gap-2 md:flex">
            {REPORT_METHOD_KEYS.map((key) => (
              <CheckboxRow key={key} className="w-auto py-1.5">
                <input
                  type="checkbox"
                  checked={!hiddenMethods.includes(key)}
                  onChange={() => toggleMethod(key)}
                />
                {t(`methods.${key}`)}
              </CheckboxRow>
            ))}
          </div>
        ) : null}

        <div className="hidden max-h-[65vh] overflow-auto rounded-2xl border border-border/70 bg-card md:block">
          <table className="w-full border-separate border-spacing-0 text-sm tabular-nums">
            <thead>
              <tr>
                <HeadCell>{t("colClosedAt")}</HeadCell>
                <HeadCell>{t("colOrder")}</HeadCell>
                <HeadCell>{t("colCaja")}</HeadCell>
                <HeadCell>{t("colTable")}</HeadCell>
                <HeadCell>{t("colStatus")}</HeadCell>
                <HeadCell align="right">{t("colTotal")}</HeadCell>
                <HeadCell align="right">{t("colTip")}</HeadCell>
                {visibleMethods.map((key) => (
                  <HeadCell key={key} align="right">
                    {t(`methods.${key}`)}
                  </HeadCell>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <SelectableRow key={row.billId} onSelect={() => setSelected(row)}>
                  <BodyCell>{formatReportDateTime(row.closedAt, locale)}</BodyCell>
                  <BodyCell className="font-medium">#{row.orderNumber}</BodyCell>
                  <BodyCell>{row.caja}</BodyCell>
                  <BodyCell>{row.table ?? "—"}</BodyCell>
                  <BodyCell>
                    <Badge variant={row.paymentStatus === "Mixto" ? "secondary" : "outline"}>
                      {statusLabel(row)}
                    </Badge>
                  </BodyCell>
                  <BodyCell align="right" className="font-medium">
                    {formatMoney(row.total)}
                  </BodyCell>
                  <BodyCell align="right">{formatMoney(row.tip)}</BodyCell>
                  {visibleMethods.map((key) => {
                    const amount = amountOf(row.methods, key);
                    return (
                      <BodyCell
                        key={key}
                        align="right"
                        className={cn(isZero(amount) && "text-muted-foreground/50")}
                      >
                        {isZero(amount) ? "—" : formatMoney(amount)}
                      </BodyCell>
                    );
                  })}
                </SelectableRow>
              ))}
            </tbody>
            {totals ? (
              <tfoot>
                <tr>
                  <FootCell colSpan={5}>{t("totalsRow", { count: totals.bills })}</FootCell>
                  <FootCell align="right">{formatMoney(totals.payable)}</FootCell>
                  <FootCell align="right">{formatMoney(totals.tip)}</FootCell>
                  {visibleMethods.map((key) => (
                    <FootCell key={key} align="right">
                      {formatMoney(amountOf(totals.methods, key))}
                    </FootCell>
                  ))}
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>

        <ul className="space-y-3 md:hidden">
          {rows.map((row) => (
            <li key={row.billId}>
              <button
                type="button"
                className="w-full cursor-pointer rounded-2xl border border-border/70 bg-card p-4 text-left shadow-sm"
                onClick={() => setSelected(row)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">#{row.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatReportDateTime(row.closedAt, locale)}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {row.caja}
                      {row.table ? ` · ${row.table}` : ""}
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
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant={row.paymentStatus === "Mixto" ? "secondary" : "outline"}>
                    {statusLabel(row)}
                  </Badge>
                  {row.methods
                    .filter((entry) => !isZero(entry.amount))
                    .map((entry) => (
                      <Badge key={entry.method} variant="secondary" className="tabular-nums">
                        {t(`methods.${entry.method}`)} {formatMoney(entry.amount)}
                      </Badge>
                    ))}
                </div>
              </button>
            </li>
          ))}
          {totals ? (
            <li className="rounded-2xl border border-border bg-muted p-4">
              <p className="text-sm font-semibold">{t("totalsRow", { count: totals.bills })}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatMoney(totals.payable)}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {t("colTip")}: {formatMoney(totals.tip)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {totals.methods
                  .filter((entry) => !isZero(entry.amount))
                  .map((entry) => (
                    <Badge key={entry.method} variant="secondary" className="tabular-nums">
                      {t(`methods.${entry.method}`)} {formatMoney(entry.amount)}
                    </Badge>
                  ))}
              </div>
            </li>
          ) : null}
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
                <DialogTitle>{t("detailOrderTitle", { order: selected.orderNumber })}</DialogTitle>
                <DialogDescription>
                  {formatReportDateTime(selected.closedAt, locale)}
                </DialogDescription>
              </DialogHeader>
              <DetailGrid
                items={[
                  [t("colCaja"), selected.caja],
                  [
                    t("colTable"),
                    [selected.table, selected.zone].filter(Boolean).join(" · ") || "—",
                  ],
                  [t("colWaiter"), selected.waiter ?? "—"],
                  [t("colCashier"), selected.cashier ?? "—"],
                  [t("colGuests"), selected.guests ?? "—"],
                  [t("colStatus"), statusLabel(selected)],
                  [t("colPaymentsCount"), selected.paymentsCount],
                  [t("colTotal"), formatMoney(selected.total)],
                  [t("colDiscounts"), formatMoney(selected.discounts)],
                  [t("colTip"), formatMoney(selected.tip)],
                  [t("colReceiptNumber"), selected.receiptNumber ?? "—"],
                  [t("colRefunded"), formatMoney(selected.refunded)],
                ]}
              />
              <div>
                <p className="mb-2 text-sm font-semibold">{t("detailMethods")}</p>
                <ul className="divide-y divide-border/70 rounded-2xl border border-border/70">
                  {selected.methods
                    .filter((entry) => !isZero(entry.amount))
                    .map((entry) => (
                      <li
                        key={entry.method}
                        className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
                      >
                        <span>{t(`methods.${entry.method}`)}</span>
                        <span className="font-medium tabular-nums">
                          {formatMoney(entry.amount)}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </ReportQueryState>
  );
}
