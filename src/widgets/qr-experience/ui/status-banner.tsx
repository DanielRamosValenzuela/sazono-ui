"use client";

import { ChefHat, HandCoins } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatMoney } from "@/shared/lib/format";
import type { OrderResponse, OrderStatus, PaymentBillSummary } from "@/shared/types/order";

const PAYABLE_STATUSES: OrderStatus[] = ["AWAITING_PAYMENT", "PAYMENT_FAILED"];

const IN_PRODUCTION_STATUS_PRIORITY: OrderStatus[] = [
  "READY",
  "PARTIALLY_READY",
  "IN_PREPARATION",
  "ROUTED",
  "CONFIRMED",
];

type StatusBannerProps = {
  orders: OrderResponse[] | undefined;
  bill: PaymentBillSummary | null | undefined;
  onPayOrder: (order: OrderResponse) => void;
  onOpenBill: () => void;
};

export function StatusBanner({
  orders,
  bill,
  onPayOrder,
  onOpenBill,
}: StatusBannerProps) {
  const t = useTranslations("QrPage");

  const payableOrder = (orders ?? []).find((order) =>
    PAYABLE_STATUSES.includes(order.status)
  );
  const remainingAmount = bill ? Number(bill.remainingAmount) : 0;

  if (payableOrder) {
    return (
      <button
        type="button"
        onClick={() => onPayOrder(payableOrder)}
        className="mt-5 flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-left transition-colors hover:bg-primary/15"
      >
        <span className="flex items-center gap-2.5">
          <HandCoins className="size-5 shrink-0 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {t("banner_payOrder_title")}
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          {t("banner_payOrder_cta")}
        </span>
      </button>
    );
  }

  if (remainingAmount > 0) {
    return (
      <button
        type="button"
        onClick={onOpenBill}
        className="mt-5 flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-left transition-colors hover:bg-primary/15"
      >
        <span className="flex items-center gap-2.5">
          <HandCoins className="size-5 shrink-0 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {t("banner_pendingBill_title", {
              amount: formatMoney(remainingAmount, "CLP"),
            })}
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          {t("banner_pendingBill_cta")}
        </span>
      </button>
    );
  }

  const inProductionStatus = IN_PRODUCTION_STATUS_PRIORITY.find((status) =>
    (orders ?? []).some((order) => order.status === status)
  );

  if (inProductionStatus) {
    return (
      <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-border/70 bg-muted/50 px-4 py-3">
        <ChefHat className="size-5 shrink-0 text-muted-foreground" />
        <span className="text-sm text-foreground">
          {t(`orderHint_${inProductionStatus}`)}
        </span>
      </div>
    );
  }

  return null;
}
