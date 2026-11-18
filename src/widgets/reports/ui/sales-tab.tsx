"use client";

import { useState } from "react";
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { Columns3 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/shared/lib/format";
import { negativeClass } from "./report-format";
import { CheckboxRow } from "@/shared/ui/form-controls";
import {
  REPORT_METHOD_KEYS,
  type ReportMethodAmount,
  type ReportMethodKey,
  type SalesByOrderResponse,
  type SalesByOrderRow,
} from "@/shared/types/reports";
import { formatReportDateTime } from "./report-range";
import { OrderDetailDialog } from "./order-detail-dialog";
import { LoadMore, RefundBadge, ReportQueryState } from "./report-parts";
import { BodyCell, FootCell, HeadCell, SelectableRow } from "./report-table";

type SalesTabProps = {
  query: UseInfiniteQueryResult<InfiniteData<SalesByOrderResponse>, Error>;
  token: string | null;
  branchId: string;
  isFiltered: boolean;
  onClearFilters: () => void;
};

const STATUS_KEYS = { Pagado: "paid", Mixto: "mixed" } as const;

function amountOf(methods: ReportMethodAmount[], key: ReportMethodKey) {
  return methods.find((entry) => entry.method === key)?.amount ?? "0";
}

const ALWAYS_VISIBLE_METHODS: ReportMethodKey[] = [
  "CASH",
  "CREDIT_CARD",
  "DEBIT_CARD",
];

function isZero(amount: string) {
  return Number(amount) === 0;
}

export function SalesTab({
  query,
  token,
  branchId,
  isFiltered,
  onClearFilters,
}: SalesTabProps) {
  const t = useTranslations("Reports");
  const locale = useLocale();
  const [methodOverrides, setMethodOverrides] = useState<
    Partial<Record<ReportMethodKey, boolean>>
  >({});
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [selected, setSelected] = useState<SalesByOrderRow | null>(null);

  const pages = query.data?.pages ?? [];
  const rows = pages.flatMap((page) => page.rows);
  const totals = pages[0]?.totals;
  const isMethodVisible = (key: ReportMethodKey) =>
    methodOverrides[key] ??
    (ALWAYS_VISIBLE_METHODS.includes(key) ||
      !isZero(amountOf(totals?.methods ?? [], key)));
  const visibleMethods = REPORT_METHOD_KEYS.filter(isMethodVisible);

  const toggleMethod = (key: ReportMethodKey) =>
    setMethodOverrides((current) => ({
      ...current,
      [key]: !isMethodVisible(key),
    }));

  const statusLabel = (row: SalesByOrderRow) =>
    t(`salesStatus.${STATUS_KEYS[row.paymentStatus]}`);

  return (
    <>
      <ReportQueryState
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={rows.length === 0}
        isRefreshing={query.isPlaceholderData}
        isFiltered={isFiltered}
        onClearFilters={onClearFilters}
        onRetry={() => void query.refetch()}
      >
        <div className="space-y-3">
          {totals?.otherPeriod.included &&
          (Number(totals.otherPeriod.refunded) !== 0 ||
            Number(totals.otherPeriod.tipRefunded) !== 0) ? (
            <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground tabular-nums">
              {t("otherPeriodRefunds", {
                amount: formatMoney(totals.otherPeriod.refunded),
              })}
            </p>
          ) : null}
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
                    checked={isMethodVisible(key)}
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
                  <HeadCell align="right">{t("colRefunded")}</HeadCell>
                  <HeadCell align="right">{t("colNet")}</HeadCell>
                  <HeadCell align="right">{t("colNetAmount")}</HeadCell>
                  <HeadCell align="right">{t("colVat")}</HeadCell>
                  <HeadCell>{t("colReceipt")}</HeadCell>
                  <HeadCell>{t("colBillNumber")}</HeadCell>
                  {visibleMethods.map((key) => (
                    <HeadCell key={key} align="right">
                      {t(`methods.${key}`)}
                    </HeadCell>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <SelectableRow
                    key={row.billId}
                    onSelect={() => setSelected(row)}
                  >
                    <BodyCell>
                      {formatReportDateTime(row.closedAt, locale)}
                    </BodyCell>
                    <BodyCell className="font-medium">
                      #{row.orderNumber}
                    </BodyCell>
                    <BodyCell>{row.caja}</BodyCell>
                    <BodyCell>{row.table ?? "—"}</BodyCell>
                    <BodyCell>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={
                            row.paymentStatus === "Mixto" ? "secondary" : "outline"
                          }
                        >
                          {statusLabel(row)}
                        </Badge>
                        <RefundBadge
                          status={row.refundStatus}
                          refunded={Number(row.refunded) + Number(row.tipRefunded)}
                        />
                      </div>
                    </BodyCell>
                    <BodyCell align="right" className="font-medium">
                      {formatMoney(row.total)}
                    </BodyCell>
                    <BodyCell align="right">{formatMoney(row.tip)}</BodyCell>
                    <BodyCell
                      align="right"
                      className={cn(isZero(row.refunded) && "text-muted-foreground/50")}
                    >
                      {isZero(row.refunded) ? "—" : formatMoney(row.refunded)}
                    </BodyCell>
                    <BodyCell
                      align="right"
                      className={cn("font-medium", negativeClass(row.net))}
                    >
                      {formatMoney(row.net)}
                    </BodyCell>
                    <BodyCell align="right">
                      {formatMoney(row.netAmount)}
                    </BodyCell>
                    <BodyCell align="right">{formatMoney(row.vatAmount)}</BodyCell>
                    <BodyCell className="text-muted-foreground">
                      {row.receipt
                        ? `${row.receipt}${row.receiptNumber ? ` #${row.receiptNumber}` : ""}`
                        : "—"}
                    </BodyCell>
                    <BodyCell>{row.billNumber ? `#${row.billNumber}` : "—"}</BodyCell>
                    {visibleMethods.map((key) => {
                      const amount = amountOf(row.methods, key);
                      return (
                        <BodyCell
                          key={key}
                          align="right"
                          className={cn(
                            isZero(amount) && "text-muted-foreground/50",
                          )}
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
                    <FootCell colSpan={5}>
                      {t("totalsRow", { count: totals.bills })}
                    </FootCell>
                    <FootCell align="right">
                      {formatMoney(totals.payable)}
                    </FootCell>
                    <FootCell align="right">{formatMoney(totals.tip)}</FootCell>
                    <FootCell align="right">
                      {formatMoney(totals.refunded)}
                    </FootCell>
                    <FootCell align="right" className={negativeClass(totals.net)}>
                      {formatMoney(totals.net)}
                    </FootCell>
                    <FootCell align="right">
                      {formatMoney(totals.netAmount)}
                    </FootCell>
                    <FootCell align="right">
                      {formatMoney(totals.vatAmount)}
                    </FootCell>
                    <FootCell colSpan={2}>{null}</FootCell>
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
                      {row.refundStatus !== "NONE" ? (
                        <p
                          className={cn(
                            "text-xs tabular-nums",
                            negativeClass(row.net) ?? "text-muted-foreground"
                          )}
                        >
                          {t("colNet")}: {formatMoney(row.net)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge
                      variant={
                        row.paymentStatus === "Mixto" ? "secondary" : "outline"
                      }
                    >
                      {statusLabel(row)}
                    </Badge>
                    <RefundBadge
                      status={row.refundStatus}
                      refunded={Number(row.refunded) + Number(row.tipRefunded)}
                    />
                    {row.methods
                      .filter((entry) => !isZero(entry.amount))
                      .map((entry) => (
                        <Badge
                          key={entry.method}
                          variant="secondary"
                          className="tabular-nums"
                        >
                          {t(`methods.${entry.method}`)}{" "}
                          {formatMoney(entry.amount)}
                        </Badge>
                      ))}
                  </div>
                </button>
              </li>
            ))}
            {totals ? (
              <li className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-sm font-semibold">
                  {t("totalsRow", { count: totals.bills })}
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {formatMoney(totals.payable)}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {t("colTip")}: {formatMoney(totals.tip)}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {t("colRefunded")}: {formatMoney(totals.refunded)} ·{" "}
                  {t("colNet")}: {formatMoney(totals.net)}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {t("colNetAmount")}: {formatMoney(totals.netAmount)} ·{" "}
                  {t("colVat")}: {formatMoney(totals.vatAmount)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {totals.methods
                    .filter((entry) => !isZero(entry.amount))
                    .map((entry) => (
                      <Badge
                        key={entry.method}
                        variant="secondary"
                        className="tabular-nums"
                      >
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

      </ReportQueryState>
      <OrderDetailDialog
        token={token}
        branchId={branchId}
        billId={selected?.billId ?? null}
        orderNumber={selected?.orderNumber ?? null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
