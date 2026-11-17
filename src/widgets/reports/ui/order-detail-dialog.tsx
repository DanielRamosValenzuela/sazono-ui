"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleAlert } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ApiError } from "@/shared/api/http-client";
import { reportsApi, retryReportRequest } from "@/shared/api/reports-api";
import { formatMoney } from "@/shared/lib/format";
import type {
  OrderDetailItem,
  OrderDetailResponse,
} from "@/shared/types/reports";
import { DetailGrid } from "./report-parts";
import { formatReportDateTime } from "./report-range";

type OrderDetailDialogProps = {
  token: string | null;
  branchId: string;
  billId: string | null;
  orderNumber: string | null;
  onClose: () => void;
};

const DETAIL_STALE_TIME_MS = 60_000;

type FlagBadge = {
  key: string;
  variant: "destructive" | "secondary" | "outline";
};

function activeFlags(detail: OrderDetailResponse): FlagBadge[] {
  const { flags, totals } = detail;
  const badges: FlagBadge[] = [
    {
      key: totals.reconciled ? "reconciled" : "notReconciled",
      variant: totals.reconciled ? "outline" : "destructive",
    },
  ];
  const candidates: Array<[boolean, FlagBadge]> = [
    [flags.partiallyPaid, { key: "partiallyPaid", variant: "destructive" }],
    [flags.abandoned, { key: "abandoned", variant: "destructive" }],
    [flags.voided, { key: "voided", variant: "destructive" }],
    [flags.overpaid, { key: "overpaid", variant: "destructive" }],
    [flags.hasOpenPayments, { key: "hasOpenPayments", variant: "destructive" }],
    [flags.hasCancelledItems, { key: "hasCancelledItems", variant: "secondary" }],
    [
      flags.hasUnclassifiedPayments,
      { key: "hasUnclassifiedPayments", variant: "secondary" },
    ],
    [flags.hasRefundedPayments, { key: "hasRefundedPayments", variant: "secondary" }],
    [flags.mixedMethods, { key: "mixedMethods", variant: "secondary" }],
  ];

  for (const [active, badge] of candidates) {
    if (active) {
      badges.push(badge);
    }
  }

  return badges;
}

function groupItems(detail: OrderDetailResponse) {
  const groups = new Map<string, OrderDetailItem[]>();

  for (const item of detail.items) {
    groups.set(item.orderId, [...(groups.get(item.orderId) ?? []), item]);
  }

  const ordered = detail.orders
    .filter((order) => groups.has(order.id))
    .map((order) => ({ order, items: groups.get(order.id) ?? [] }));
  const known = new Set(detail.orders.map((order) => order.id));
  const orphans = [...groups.entries()]
    .filter(([orderId]) => !known.has(orderId))
    .map(([orderId, items]) => ({
      order: {
        id: orderId,
        status: items[0]?.orderStatus ?? "",
        source: "",
        createdAt: "",
        notes: null,
      },
      items,
    }));

  return [...ordered, ...orphans];
}

export function OrderDetailDialog({
  token,
  branchId,
  billId,
  orderNumber,
  onClose,
}: OrderDetailDialogProps) {
  const t = useTranslations("Reports");
  const locale = useLocale();
  const query = useQuery({
    queryKey: ["reports", "order-detail", branchId, billId],
    enabled: Boolean(token) && Boolean(billId),
    staleTime: DETAIL_STALE_TIME_MS,
    retry: retryReportRequest,
    queryFn: () => reportsApi.getOrderDetail(token!, branchId, billId!),
  });
  const detail = query.data;
  const number = detail?.orderNumber ?? orderNumber;
  const dateTime = (iso: string | null) =>
    iso ? formatReportDateTime(iso, locale) : "—";
  const labelOf = (prefix: string, value: string) =>
    value && t.has(`${prefix}.${value}`) ? t(`${prefix}.${value}`) : value || "—";

  return (
    <Dialog open={billId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border bg-card px-4 py-4 pr-12 sm:px-6">
          <DialogTitle>
            {number
              ? t("orderDetail.title", { order: number })
              : t("orderDetail.titleGeneric")}
          </DialogTitle>
          <DialogDescription>
            {detail
              ? [
                  detail.table.name,
                  detail.zone?.name,
                  dateTime(detail.closedAt ?? detail.openedAt),
                ]
                  .filter(Boolean)
                  .join(" · ")
              : t("orderDetail.description")}
          </DialogDescription>
          {detail ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeFlags(detail).map((badge) => (
                <Badge key={badge.key} variant={badge.variant}>
                  {t(`orderDetail.flags.${badge.key}`)}
                </Badge>
              ))}
              {detail.isCounter ? (
                <Badge variant="outline">{t("orderDetail.counter")}</Badge>
              ) : null}
            </div>
          ) : null}
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6">
          {query.isLoading ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : query.isError ? (
            <div
              role="alert"
              className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/25 bg-destructive/8 px-6 py-8 text-center"
            >
              <CircleAlert className="size-6 text-destructive" />
              <p className="font-semibold text-destructive">
                {query.error instanceof ApiError && query.error.status === 404
                  ? t("orderDetail.notFound")
                  : t("errorTitle")}
              </p>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => void query.refetch()}
              >
                {t("retry")}
              </Button>
            </div>
          ) : detail ? (
            <>
              <DetailGrid
                className="sm:grid-cols-3"
                items={[
                  [t("colTable"), detail.table.name],
                  [t("colWaiter"), detail.waiter?.name ?? "—"],
                  [t("orderDetail.cashiers"), detail.cashiers.join(", ") || "—"],
                  [t("colGuests"), detail.guests ?? "—"],
                  [t("orderDetail.customer"), detail.customerLabel ?? "—"],
                  [t("orderDetail.openedBy"), detail.openedBy ?? "—"],
                  [t("orderDetail.openedAt"), dateTime(detail.openedAt)],
                  [t("orderDetail.closedAt"), dateTime(detail.closedAt)],
                  [t("orderDetail.paidAt"), dateTime(detail.paidAt)],
                  [
                    t("orderDetail.sessionOpenedAt"),
                    dateTime(detail.sessionOpenedAt),
                  ],
                  [
                    t("orderDetail.sessionClosedAt"),
                    dateTime(detail.sessionClosedAt),
                  ],
                  [t("orderDetail.closeReason"), detail.closeReason ?? "—"],
                ]}
              />

              <section aria-labelledby="order-detail-products" className="space-y-3">
                <h3 id="order-detail-products" className="text-sm font-semibold">
                  {t("orderDetail.products")}
                </h3>
                {detail.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("orderDetail.noItems")}
                  </p>
                ) : (
                  groupItems(detail).map((group, index) => (
                    <div
                      key={group.order.id}
                      className="overflow-hidden rounded-2xl border border-border/70"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-muted px-4 py-2 text-xs">
                        <span className="font-semibold">
                          {t("orderDetail.orderHeading", { index: index + 1 })}
                        </span>
                        <span className="text-muted-foreground">
                          {labelOf("orderDetail.orderStatus", group.order.status)}
                        </span>
                        {group.order.source ? (
                          <span className="text-muted-foreground">
                            {labelOf("sources", group.order.source)}
                          </span>
                        ) : null}
                        {group.order.createdAt ? (
                          <span className="text-muted-foreground">
                            {dateTime(group.order.createdAt)}
                          </span>
                        ) : null}
                        {group.order.notes ? (
                          <span className="w-full italic text-muted-foreground">
                            {t("orderDetail.note")}: {group.order.notes}
                          </span>
                        ) : null}
                      </div>
                      <ul className="divide-y divide-border/60">
                        {group.items.map((item) => (
                          <li
                            key={item.id}
                            className={cn(
                              "flex items-start justify-between gap-3 px-4 py-3 text-sm",
                              !item.counted && !item.cancelled && "opacity-70"
                            )}
                          >
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "font-medium break-words",
                                  item.cancelled &&
                                    "text-muted-foreground line-through"
                                )}
                              >
                                {item.quantity} × {item.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.categoryPath.length > 0
                                  ? item.categoryPath.join(" > ")
                                  : item.categoryLabel}
                              </p>
                              {item.modifiers.length > 0 ? (
                                <ul
                                  className={cn(
                                    "mt-1 space-y-0.5 text-xs text-muted-foreground",
                                    item.cancelled && "line-through"
                                  )}
                                >
                                  {item.modifiers.map((modifier, modifierIndex) => (
                                    <li key={`${modifier.name}-${modifierIndex}`}>
                                      + {modifier.name}
                                      {Number(modifier.priceDelta) !== 0
                                        ? ` (${Number(modifier.priceDelta) > 0 ? "+" : ""}${formatMoney(modifier.priceDelta)})`
                                        : ""}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                              {item.notes ? (
                                <p className="mt-1 text-xs italic text-muted-foreground">
                                  {t("orderDetail.note")}: {item.notes}
                                </p>
                              ) : null}
                              {item.cancelled ? (
                                <Badge variant="destructive" className="mt-1">
                                  {t("orderDetail.cancelled")}
                                </Badge>
                              ) : !item.counted ? (
                                <Badge variant="secondary" className="mt-1">
                                  {t("orderDetail.excluded")}
                                </Badge>
                              ) : null}
                            </div>
                            <div className="shrink-0 text-right tabular-nums">
                              <p
                                className={cn(
                                  "font-semibold",
                                  item.cancelled &&
                                    "text-muted-foreground line-through"
                                )}
                              >
                                {formatMoney(item.lineTotal)}
                              </p>
                              {item.quantity > 1 ? (
                                <p className="text-xs text-muted-foreground">
                                  {t("orderDetail.unitPrice", {
                                    price: formatMoney(item.unitPrice),
                                  })}
                                </p>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </section>

              <section aria-labelledby="order-detail-payments" className="space-y-3">
                <h3 id="order-detail-payments" className="text-sm font-semibold">
                  {t("orderDetail.payments")}
                </h3>
                {detail.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("orderDetail.noPayments")}
                  </p>
                ) : (
                  <ul className="divide-y divide-border/60 rounded-2xl border border-border/70">
                    {detail.payments.map((payment) => (
                      <li key={payment.id} className="space-y-1 px-4 py-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium">
                              {t(`methods.${payment.method}`)}
                              <span className="font-normal text-muted-foreground">
                                {" "}
                                · {payment.provider}
                              </span>
                            </p>
                            <p className="text-xs break-all text-muted-foreground">
                              {payment.providerReference
                                ? `${t("colReference")}: ${payment.providerReference}`
                                : "—"}
                            </p>
                          </div>
                          <div className="shrink-0 text-right tabular-nums">
                            <p className="font-semibold">
                              {formatMoney(payment.total)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatMoney(payment.amount)} + {t("colTip")}{" "}
                              {formatMoney(payment.tip)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <Badge
                            variant={
                              payment.status === "PAID" ? "outline" : "secondary"
                            }
                          >
                            {labelOf("paymentStatus", payment.status)}
                          </Badge>
                          <span>{payment.cashier ?? payment.caja}</span>
                          <span>
                            {payment.source ? labelOf("sources", payment.source) : "—"}
                          </span>
                          <span>
                            {dateTime(payment.paidAt ?? payment.createdAt)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="order-detail-totals" className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 id="order-detail-totals" className="text-sm font-semibold">
                    {t("orderDetail.reconciliation")}
                  </h3>
                  <Badge
                    variant={detail.totals.reconciled ? "outline" : "destructive"}
                  >
                    {t(
                      detail.totals.reconciled
                        ? "orderDetail.flags.reconciled"
                        : "orderDetail.flags.notReconciled"
                    )}
                  </Badge>
                </div>
                <DetailGrid
                  className="rounded-2xl border border-border/70 bg-muted/40 p-4 sm:grid-cols-3"
                  items={[
                    [t("orderDetail.itemsTotal"), formatMoney(detail.totals.itemsTotal)],
                    [
                      t("orderDetail.excludedTotal"),
                      formatMoney(detail.totals.excludedItemsTotal),
                    ],
                    [t("orderDetail.billTotal"), formatMoney(detail.totals.billTotal)],
                    [t("orderDetail.paid"), formatMoney(detail.totals.paid)],
                    [t("colTip"), formatMoney(detail.totals.tip)],
                    [t("orderDetail.collected"), formatMoney(detail.totals.collected)],
                    [t("orderDetail.remaining"), formatMoney(detail.totals.remaining)],
                    [t("orderDetail.difference"), formatMoney(detail.totals.difference)],
                    [t("colRefunded"), formatMoney(detail.totals.refunded)],
                  ]}
                />
              </section>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
