"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { HandCoins } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { qrApi } from "@/shared/api/qr-api";
import { formatMoney } from "@/shared/lib/format";
import type { OrderResponse } from "@/shared/types/order";
import { FieldGroup, FieldLabel } from "@/shared/ui/form-controls";
import { TextInput } from "@/shared/ui/form-controls";
import { cn } from "@/lib/utils";
import { BottomSheet } from "./bottom-sheet";

const TIP_PERCENTAGES = [0, 5, 10] as const;

type PaymentSheetProps = {
  qrToken: string;
  order: OrderResponse;
  onClose: () => void;
  onPaid: () => void;
};

export function PaymentSheet({
  qrToken,
  order,
  onClose,
  onPaid,
}: PaymentSheetProps) {
  const t = useTranslations("QrPage");
  const [tipPercentage, setTipPercentage] = useState<number>(0);
  const [customTip, setCustomTip] = useState("");
  const [useCustomTip, setUseCustomTip] = useState(false);

  const orderTotal = Number(order.orderTotalAmount);
  const tipAmount = useCustomTip
    ? Math.max(0, Math.floor(Number(customTip) || 0))
    : Math.round((orderTotal * tipPercentage) / 100);
  const totalDue = orderTotal + tipAmount;

  const payOrder = useMutation({
    mutationFn: () =>
      qrApi.payOrder(
        qrToken,
        order.orderId,
        tipAmount > 0 ? { tipAmount: String(tipAmount) } : {}
      ),
    onSuccess: () => {
      toast.success(t("pay_successToast"));
      onPaid();
    },
    onError: () => {
      toast.error(t("pay_errorToast"));
    },
  });

  return (
    <BottomSheet onClose={onClose} labelledBy="qr-pay-title">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HandCoins className="size-5" />
        </div>
        <div>
          <h2
            id="qr-pay-title"
            className="font-heading text-2xl font-bold text-foreground"
          >
            {t("pay_title")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("pay_description")}
          </p>
        </div>
      </div>

      <FieldGroup className="mt-6">
        <FieldLabel>{t("pay_tipLabel")}</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {TIP_PERCENTAGES.map((percentage) => {
            const selected = !useCustomTip && tipPercentage === percentage;

            return (
              <button
                key={percentage}
                type="button"
                onClick={() => {
                  setUseCustomTip(false);
                  setTipPercentage(percentage);
                }}
                className={cn(
                  "cursor-pointer rounded-xl border px-2 py-2.5 text-sm font-semibold transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/80 bg-background/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {percentage === 0 ? t("pay_tipNone") : `${percentage}%`}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <FieldLabel
            htmlFor="qr-pay-custom-tip"
            className="shrink-0 text-xs font-medium text-muted-foreground"
          >
            {t("pay_tipCustomLabel")}
          </FieldLabel>
          <TextInput
            id="qr-pay-custom-tip"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={t("pay_tipCustomPlaceholder")}
            value={customTip}
            onChange={(event) => {
              const digitsOnly = event.target.value.replace(/[^0-9]/g, "");
              setCustomTip(digitsOnly);
              setUseCustomTip(digitsOnly !== "");
            }}
            className="h-10"
          />
        </div>
      </FieldGroup>

      <dl className="mt-6 space-y-2 border-t border-border/60 pt-4 text-sm">
        <div className="flex items-baseline justify-between">
          <dt className="text-muted-foreground">{t("pay_orderTotal")}</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {formatMoney(orderTotal, "CLP")}
          </dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-muted-foreground">{t("pay_tip")}</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {formatMoney(tipAmount, "CLP")}
          </dd>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <dt className="text-base font-medium text-foreground">
            {t("pay_totalDue")}
          </dt>
          <dd className="font-heading text-2xl font-bold text-foreground">
            {formatMoney(totalDue, "CLP")}
          </dd>
        </div>
      </dl>

      <div className="mt-5 space-y-2">
        <Button
          type="button"
          size="lg"
          className="w-full rounded-xl"
          disabled={payOrder.isPending}
          onClick={() => payOrder.mutate()}
        >
          {payOrder.isPending ? <Spinner /> : null}
          {t("pay_submit")}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="ghost"
          className="w-full rounded-xl"
          onClick={onClose}
        >
          {t("pay_later")}
        </Button>
      </div>
    </BottomSheet>
  );
}
