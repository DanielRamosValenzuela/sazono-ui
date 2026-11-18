"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Download, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { reportsApi, retryReportRequest } from "@/shared/api/reports-api";
import { formatMoney } from "@/shared/lib/format";
import type { DailyZResponse } from "@/shared/types/reports";
import { TextInput } from "@/shared/ui/form-controls";
import { StatCard } from "@/shared/ui/stat-card";
import { downloadBlob } from "./download-blob";
import { BodyCell, FootCell, HeadCell } from "./report-table";
import { todayKey } from "./report-range";

type DailyZTabProps = {
  token: string | null;
  branchId: string;
  fullAccess: boolean;
  enabled: boolean;
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function buildDailyZCsv(data: DailyZResponse, t: Translate): string {
  const lines: Array<Array<string | number>> = [];
  const push = (...cells: Array<string | number>) => lines.push(cells);

  push(t("zTitle"), data.date);

  if (data.sales && data.refunds && data.afterRefunds) {
    push(t("zDocs"), data.sales.documents.count);
    push(
      t("zDocsRange"),
      data.sales.documents.firstNumber ?? "",
      data.sales.documents.lastNumber ?? ""
    );
    push(t("zNet"), Number(data.sales.netAmount));
    push(t("zExempt"), Number(data.sales.exemptAmount));
    push(t("zVat"), Number(data.sales.vatAmount));
    push(t("zTotal"), Number(data.sales.total));
    push(t("zTips"), Number(data.sales.tipAmount));
    push(t("zCollected"), Number(data.sales.collected));
    push(t("zDiscounts"), data.sales.discountCount, Number(data.sales.discounts));
    push(t("zRefunds"), data.refunds.count, Number(data.refunds.amount));
    push(t("zRefundNet"), Number(data.refunds.netAmount));
    push(t("zRefundVat"), Number(data.refunds.vatAmount));
    push(t("zAfterNet"), Number(data.afterRefunds.netAmount));
    push(t("zAfterVat"), Number(data.afterRefunds.vatAmount));
    push("");
    push(t("zByMethod"));
    push(t("zMethod"), t("zCount"), t("zAmount"), t("zTips"), t("zCollected"));
    for (const row of data.byMethod) {
      push(row.label, row.count, Number(row.amount), Number(row.tip), Number(row.collected));
    }
    push("");
    push(t("zByCategory"));
    push(t("zCategory"), t("zQuantity"), t("zAmount"));
    for (const row of data.byCategory) {
      push(row.category, row.quantity, Number(row.amount));
    }
    push("");
  }

  push(t("zCashClosing"));
  push(
    t("zCashier"),
    t("zCashSales"),
    t("zCashIn"),
    t("zCashOut"),
    t("zRefundOut"),
    t("zOtherMovements"),
    t("zExpected")
  );
  for (const row of data.cashClosing.rows) {
    push(
      row.name ?? t("zUnassigned"),
      Number(row.cashSales),
      Number(row.cashIn),
      Number(row.cashOut),
      Number(row.refundOut),
      Number(row.otherMovements),
      Number(row.expectedCash)
    );
  }
  push(t("zExpectedTotal"), Number(data.cashClosing.expectedCash));

  const escape = (cell: string | number) => {
    const text = String(cell);
    const safe = /^[=+\-@]/.test(text) && typeof cell === "string" ? `'${text}` : text;
    return /[;"\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };

  return `﻿${lines.map((line) => line.map(escape).join(";")).join("\r\n")}`;
}

type CardRow = {
  key: string;
  name: string;
  fields: Array<[label: string, value: string, strong?: boolean]>;
};

function SectionTable({
  title,
  children,
  cards,
  cardsFoot,
}: {
  title: string;
  children: React.ReactNode;
  cards?: CardRow[];
  cardsFoot?: [label: string, value: string];
}) {
  return (
    <section className="space-y-2 break-inside-avoid">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <div
        className={cn(
          "overflow-x-auto rounded-2xl border border-border/70 bg-card",
          cards && "hidden sm:block print:block"
        )}
      >
        <table className="w-full border-separate border-spacing-0 text-sm tabular-nums">
          {children}
        </table>
      </div>
      {cards ? (
        <ul className="space-y-3 sm:hidden print:hidden">
          {cards.map((card) => (
            <li
              key={card.key}
              className="rounded-2xl border border-border/70 bg-card p-4"
            >
              <p className="text-base font-semibold break-words">{card.name}</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                {card.fields.map(([label, value, strong]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd
                      className={cn(
                        "text-sm tabular-nums break-words",
                        strong ? "font-bold" : "font-medium"
                      )}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
          {cardsFoot ? (
            <li className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted p-4 text-sm font-bold tabular-nums">
              <span>{cardsFoot[0]}</span>
              <span>{cardsFoot[1]}</span>
            </li>
          ) : null}
        </ul>
      ) : null}
    </section>
  );
}

export function DailyZTab({ token, branchId, fullAccess, enabled }: DailyZTabProps) {
  const t = useTranslations("Reports");
  const tDiscounts = useTranslations("Discounts");
  const [date, setDate] = useState(todayKey);
  const validDate = DATE_PATTERN.test(date);

  const query = useQuery({
    queryKey: ["reports", "daily-z", branchId, fullAccess ? date : "today"],
    enabled: enabled && Boolean(token) && validDate,
    placeholderData: keepPreviousData,
    retry: retryReportRequest,
    staleTime: 60_000,
    queryFn: () => reportsApi.getDailyZ(token!, branchId, date),
  });

  const data = query.data;
  const translate = t as unknown as Translate;

  const exportCsv = () => {
    if (!data) {
      return;
    }

    downloadBlob(
      new Blob([buildDailyZCsv(data, translate)], { type: "text/csv;charset=utf-8" }),
      `z-diario_${branchId}_${data.date}.csv`
    );
  };

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-wrap items-end gap-3 print:hidden">
        {fullAccess ? (
          <div>
            <label htmlFor="daily-z-date" className="mb-1 block text-xs font-medium text-muted-foreground">
              {t("zDate")}
            </label>
            <TextInput
              id="daily-z-date"
              type="date"
              value={date}
              max={todayKey()}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
        ) : (
          <p className="text-sm font-medium">{t("zTodayOnly")}</p>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-10 rounded-full sm:min-h-0" disabled={!data} onClick={exportCsv}>
            <Download />
            {t("exportCsv")}
          </Button>
          <Button variant="outline" className="min-h-10 rounded-full sm:min-h-0" disabled={!data} onClick={() => window.print()}>
            <Printer />
            {t("zPrint")}
          </Button>
        </div>
      </div>

      {!validDate ? (
        <div role="alert" className="rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {t("invalidRange")}
        </div>
      ) : query.isError ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {t("zError")}
          <Button size="sm" variant="outline" onClick={() => void query.refetch()}>
            {t("zRetry")}
          </Button>
        </div>
      ) : query.isLoading || !data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="space-y-6">
          <h1 className="hidden text-xl font-bold print:block">
            {t("zTitle")} {data.date}
          </h1>

          {data.sales && data.refunds && data.afterRefunds ? (
            <>
              <section aria-label={t("zSummary")} className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <StatCard
                  label={t("zDocs")}
                  value={String(data.sales.documents.count)}
                  hint={
                    data.sales.documents.firstNumber !== null
                      ? t("zDocsRangeHint", {
                          from: data.sales.documents.firstNumber,
                          to: data.sales.documents.lastNumber ?? "",
                        })
                      : undefined
                  }
                />
                <StatCard label={t("zNet")} value={formatMoney(data.sales.netAmount)} />
                <StatCard label={t("zVat")} value={formatMoney(data.sales.vatAmount)} />
                <StatCard
                  label={t("zExempt")}
                  value={formatMoney(data.sales.exemptAmount)}
                />
                <StatCard label={t("zTotal")} value={formatMoney(data.sales.total)} />
                <StatCard label={t("zTips")} value={formatMoney(data.sales.tipAmount)} />
                <StatCard
                  label={t("zCollected")}
                  value={formatMoney(data.sales.collected)}
                />
                <StatCard
                  label={t("zDiscounts")}
                  value={formatMoney(data.sales.discounts)}
                  hint={t("zDiscountsHint", { count: data.sales.discountCount })}
                />
                <StatCard
                  label={t("zRefunds")}
                  value={formatMoney(data.refunds.amount)}
                  hint={t("zRefundsHint", {
                    count: data.refunds.count,
                    pending: data.refunds.pendingCreditNotes,
                  })}
                />
              </section>

              <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground tabular-nums">
                {t("zAfterRefunds", {
                  net: formatMoney(data.afterRefunds.netAmount),
                  vat: formatMoney(data.afterRefunds.vatAmount),
                  tips: formatMoney(data.afterRefunds.tipAmount),
                })}
              </p>

              <SectionTable
                title={t("zByMethod")}
                cards={data.byMethod.map((row) => ({
                  key: row.method,
                  name: t(`methods.${row.method}`),
                  fields: [
                    [t("zCount"), String(row.count)],
                    [t("zAmount"), formatMoney(row.amount)],
                    [t("zTips"), formatMoney(row.tip)],
                    [t("zCollected"), formatMoney(row.collected), true],
                  ],
                }))}
              >
                <thead>
                  <tr>
                    <HeadCell>{t("zMethod")}</HeadCell>
                    <HeadCell align="right">{t("zCount")}</HeadCell>
                    <HeadCell align="right">{t("zAmount")}</HeadCell>
                    <HeadCell align="right">{t("zTips")}</HeadCell>
                    <HeadCell align="right">{t("zCollected")}</HeadCell>
                  </tr>
                </thead>
                <tbody>
                  {data.byMethod.map((row) => (
                    <tr key={row.method}>
                      <BodyCell>{t(`methods.${row.method}`)}</BodyCell>
                      <BodyCell align="right">{row.count}</BodyCell>
                      <BodyCell align="right">{formatMoney(row.amount)}</BodyCell>
                      <BodyCell align="right">{formatMoney(row.tip)}</BodyCell>
                      <BodyCell align="right" className="font-medium">
                        {formatMoney(row.collected)}
                      </BodyCell>
                    </tr>
                  ))}
                  {data.byMethod.length === 0 ? (
                    <tr>
                      <BodyCell className="text-muted-foreground">{t("zNoData")}</BodyCell>
                      <BodyCell>{""}</BodyCell>
                      <BodyCell>{""}</BodyCell>
                      <BodyCell>{""}</BodyCell>
                      <BodyCell>{""}</BodyCell>
                    </tr>
                  ) : null}
                </tbody>
              </SectionTable>

              {data.sales.discountCount > 0 ? (
                <>
                  <SectionTable
                    title={t("zDiscountsByReason")}
                    cards={data.sales.discountsByReason.map((row) => ({
                      key: row.reasonCode,
                      name: tDiscounts.has(`reasons.${row.reasonCode}`)
                        ? tDiscounts(`reasons.${row.reasonCode}`)
                        : row.reasonCode,
                      fields: [
                        [t("zCount"), String(row.count)],
                        [t("zAmount"), formatMoney(row.amount), true],
                      ],
                    }))}
                  >
                    <thead>
                      <tr>
                        <HeadCell>{t("zReason")}</HeadCell>
                        <HeadCell align="right">{t("zDiscountCount")}</HeadCell>
                        <HeadCell align="right">{t("zAmount")}</HeadCell>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sales.discountsByReason.map((row) => (
                        <tr key={row.reasonCode}>
                          <BodyCell>
                            {tDiscounts.has(`reasons.${row.reasonCode}`)
                              ? tDiscounts(`reasons.${row.reasonCode}`)
                              : row.reasonCode}
                          </BodyCell>
                          <BodyCell align="right">{row.count}</BodyCell>
                          <BodyCell align="right">{formatMoney(row.amount)}</BodyCell>
                        </tr>
                      ))}
                    </tbody>
                  </SectionTable>

                  <SectionTable
                    title={t("zDiscountsByApprover")}
                    cards={data.sales.discountsByApprover.map((row) => ({
                      key: row.staffUserId ?? "none",
                      name: row.name ?? t("zNoApprover"),
                      fields: [
                        [t("zCount"), String(row.count)],
                        [t("zAmount"), formatMoney(row.amount), true],
                      ],
                    }))}
                  >
                    <thead>
                      <tr>
                        <HeadCell>{t("zApprover")}</HeadCell>
                        <HeadCell align="right">{t("zDiscountCount")}</HeadCell>
                        <HeadCell align="right">{t("zAmount")}</HeadCell>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sales.discountsByApprover.map((row) => (
                        <tr key={row.staffUserId ?? "none"}>
                          <BodyCell>{row.name ?? t("zNoApprover")}</BodyCell>
                          <BodyCell align="right">{row.count}</BodyCell>
                          <BodyCell align="right">{formatMoney(row.amount)}</BodyCell>
                        </tr>
                      ))}
                    </tbody>
                  </SectionTable>
                </>
              ) : null}

              <SectionTable title={t("zByCategory")}>
                <thead>
                  <tr>
                    <HeadCell>{t("zCategory")}</HeadCell>
                    <HeadCell align="right">{t("zQuantity")}</HeadCell>
                    <HeadCell align="right">{t("zAmount")}</HeadCell>
                    <HeadCell align="right">{t("zShare")}</HeadCell>
                  </tr>
                </thead>
                <tbody>
                  {data.byCategory.map((row) => (
                    <tr key={row.category}>
                      <BodyCell>{row.category}</BodyCell>
                      <BodyCell align="right">{row.quantity}</BodyCell>
                      <BodyCell align="right">{formatMoney(row.amount)}</BodyCell>
                      <BodyCell align="right">{row.share.toFixed(1)}%</BodyCell>
                    </tr>
                  ))}
                  {data.byCategory.length === 0 ? (
                    <tr>
                      <BodyCell className="text-muted-foreground">{t("zNoData")}</BodyCell>
                      <BodyCell>{""}</BodyCell>
                      <BodyCell>{""}</BodyCell>
                      <BodyCell>{""}</BodyCell>
                    </tr>
                  ) : null}
                </tbody>
              </SectionTable>
            </>
          ) : null}

          <SectionTable
            title={fullAccess ? t("zCashClosing") : t("zMyCash")}
            cards={data.cashClosing.rows.map((row) => ({
              key: row.staffUserId ?? "none",
              name: row.name ?? t("zUnassigned"),
              fields: [
                [t("zCashSales"), formatMoney(row.cashSales)],
                [t("zCashIn"), formatMoney(row.cashIn)],
                [t("zCashOut"), formatMoney(row.cashOut)],
                [t("zRefundOut"), formatMoney(row.refundOut)],
                [t("zOtherMovements"), formatMoney(row.otherMovements)],
                [t("zExpected"), formatMoney(row.expectedCash), true],
              ],
            }))}
            cardsFoot={[t("zExpectedTotal"), formatMoney(data.cashClosing.expectedCash)]}
          >
            <thead>
              <tr>
                <HeadCell>{t("zCashier")}</HeadCell>
                <HeadCell align="right">{t("zCashSales")}</HeadCell>
                <HeadCell align="right">{t("zCashIn")}</HeadCell>
                <HeadCell align="right">{t("zCashOut")}</HeadCell>
                <HeadCell align="right">{t("zRefundOut")}</HeadCell>
                <HeadCell align="right">{t("zOtherMovements")}</HeadCell>
                <HeadCell align="right">{t("zExpected")}</HeadCell>
              </tr>
            </thead>
            <tbody>
              {data.cashClosing.rows.map((row) => (
                <tr key={row.staffUserId ?? "none"}>
                  <BodyCell>{row.name ?? t("zUnassigned")}</BodyCell>
                  <BodyCell align="right">{formatMoney(row.cashSales)}</BodyCell>
                  <BodyCell align="right">{formatMoney(row.cashIn)}</BodyCell>
                  <BodyCell align="right">{formatMoney(row.cashOut)}</BodyCell>
                  <BodyCell align="right">{formatMoney(row.refundOut)}</BodyCell>
                  <BodyCell align="right">{formatMoney(row.otherMovements)}</BodyCell>
                  <BodyCell align="right" className="font-semibold">
                    {formatMoney(row.expectedCash)}
                  </BodyCell>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <FootCell colSpan={6}>{t("zExpectedTotal")}</FootCell>
                <FootCell align="right">{formatMoney(data.cashClosing.expectedCash)}</FootCell>
              </tr>
            </tfoot>
          </SectionTable>
          <p className="text-xs text-muted-foreground">{t("zCashNote")}</p>
        </div>
      )}
    </div>
  );
}
