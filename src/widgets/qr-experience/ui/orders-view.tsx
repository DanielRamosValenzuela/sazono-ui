"use client";

import { useMemo } from "react";
import { ReceiptText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { VariantProps } from "class-variance-authority";
import { formatMoney } from "@/shared/lib/format";
import type { OrderResponse, OrderStatus } from "@/shared/types/order";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const ORDER_BADGE_VARIANT: Record<OrderStatus, BadgeVariant> = {
  DRAFT: "outline",
  AWAITING_PAYMENT: "default",
  PAYMENT_FAILED: "destructive",
  CONFIRMED: "secondary",
  ROUTED: "secondary",
  IN_PREPARATION: "secondary",
  PARTIALLY_READY: "secondary",
  READY: "default",
  DELIVERED: "outline",
  CANCELLED: "destructive",
};

const PAYABLE_STATUSES: OrderStatus[] = ["AWAITING_PAYMENT", "PAYMENT_FAILED"];

type OrdersViewProps = {
  orders: OrderResponse[] | undefined;
  isLoading: boolean;
  onPay: (order: OrderResponse) => void;
  onGoToMenu: () => void;
};

export function OrdersView({
  orders,
  isLoading,
  onPay,
  onGoToMenu,
}: OrdersViewProps) {
  const t = useTranslations("QrPage");
  const tStatus = useTranslations("Shared.orderStatus");
  const locale = useLocale();

  const sortedOrders = useMemo(
    () =>
      [...(orders ?? [])].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      ),
    [orders]
  );

  if (isLoading) {
    return (
      <div className="space-y-4 px-5 pt-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (sortedOrders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ReceiptText className="size-6" />
        </div>
        <h2 className="font-heading text-xl font-bold text-foreground">
          {t("orders_empty_title")}
        </h2>
        <p className="max-w-xs text-sm leading-6 text-muted-foreground">
          {t("orders_empty_description")}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-2 rounded-full"
          onClick={onGoToMenu}
        >
          {t("orders_empty_cta")}
        </Button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <p className="text-xs leading-5 text-muted-foreground">
        {t("orders_refreshHint")}
      </p>

      <div className="mt-4 space-y-4">
        {sortedOrders.map((order) => {
          const time = new Date(order.createdAt).toLocaleTimeString(locale, {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <article
              key={order.orderId}
              className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm shadow-primary/5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("orders_time", { time })}
                </p>
                <Badge variant={ORDER_BADGE_VARIANT[order.status]}>
                  {tStatus(order.status)}
                </Badge>
              </div>

              <p className="mt-2 text-sm leading-6 text-foreground">
                {t(`orderHint_${order.status}`)}
              </p>

              <ul className="mt-3 space-y-1 border-t border-dashed border-border/70 pt-3 text-sm">
                {order.items.map((item) => (
                  <li
                    key={item.orderItemId}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <span className="min-w-0 truncate text-muted-foreground">
                      <span className="font-semibold tabular-nums text-foreground">
                        {item.quantity}×
                      </span>{" "}
                      {item.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatMoney(item.totalPrice, "CLP")}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-baseline justify-between border-t border-border/60 pt-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("orders_total")}
                </p>
                <p className="font-heading text-lg font-bold text-foreground">
                  {formatMoney(order.orderTotalAmount, "CLP")}
                </p>
              </div>

              {PAYABLE_STATUSES.includes(order.status) ? (
                <Button
                  type="button"
                  className="mt-3 w-full rounded-xl"
                  onClick={() => onPay(order)}
                >
                  {t("orders_payCta")}
                </Button>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
