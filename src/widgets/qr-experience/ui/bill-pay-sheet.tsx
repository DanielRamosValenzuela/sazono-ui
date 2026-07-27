"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CardPaymentBrick } from "@/features/mercado-pago-checkout/ui/card-payment-brick";
import { useCardCheckoutPayment } from "@/features/mercado-pago-checkout/model/use-card-checkout-payment";
import { qrApi } from "@/shared/api/qr-api";
import { formatMoney } from "@/shared/lib/format";
import type { OrderResponse, PaymentBillSummary } from "@/shared/types/order";
import type { CardCheckoutFields } from "@/shared/types/payments";
import { FieldGroup, FieldLabel } from "@/shared/ui/form-controls";
import { TextInput } from "@/shared/ui/form-controls";
import { cn } from "@/lib/utils";
import { BottomSheet } from "@/shared/ui/bottom-sheet";

const TIP_PERCENTAGES = [0, 5, 10] as const;

type BillPaySheetProps = {
  qrToken: string;
  bill: PaymentBillSummary;
  orders: OrderResponse[];
  onClose: () => void;
  onPaid: () => void;
};

export function BillPaySheet({
  qrToken,
  bill,
  orders,
  onClose,
  onPaid,
}: BillPaySheetProps) {
  const t = useTranslations("QrPage");
  const [tipPercentage, setTipPercentage] = useState<number>(0);
  const [customTip, setCustomTip] = useState("");
  const [useCustomTip, setUseCustomTip] = useState(false);
  const [brickInstanceKey, setBrickInstanceKey] = useState(0);
  const [brickFailed, setBrickFailed] = useState(false);

  const remainingAmount = Number(bill.remainingAmount);
  const tipAmount = useCustomTip
    ? Math.max(0, Math.floor(Number(customTip) || 0))
    : Math.round((remainingAmount * tipPercentage) / 100);
  const totalDue = remainingAmount + tipAmount;

  const billableOrders = orders.filter((order) => order.status !== "CANCELLED");

  const submittedRemainingRef = useRef(remainingAmount);

  const paymentConfigQuery = useQuery({
    queryKey: ["qr-payment-config", qrToken],
    queryFn: () => qrApi.getPaymentConfig(qrToken),
  });

  const isGatewayConnected =
    paymentConfigQuery.data?.gatewayConnected === true &&
    Boolean(paymentConfigQuery.data.publicKey);

  const payBill = useMutation({
    mutationFn: () =>
      qrApi.payBill(qrToken, {
        amount: bill.remainingAmount,
        ...(tipAmount > 0 ? { tipAmount: String(tipAmount) } : {}),
      }),
    onSuccess: () => {
      toast.success(t("pay_successToast"));
      onPaid();
    },
    onError: () => {
      toast.error(t("pay_errorToast"));
    },
  });

  const { phase: cardPhase, submitCheckout } = useCardCheckoutPayment({
    submit: (checkout, signal) =>
      qrApi
        .payBill(
          qrToken,
          {
            amount: bill.remainingAmount,
            ...(tipAmount > 0 ? { tipAmount: String(tipAmount) } : {}),
            ...checkout,
          },
          signal
        )
        .then(() => undefined),
    pollStatus: async () => {
      const latestBill = await qrApi.getBill(qrToken);

      if (
        !latestBill ||
        Number(latestBill.remainingAmount) < submittedRemainingRef.current
      ) {
        return "approved";
      }

      return "unresolved";
    },
    onApproved: () => {
      toast.success(t("pay_successToast"));
      onPaid();
    },
    onDeclined: (reason, message) => {
      setBrickInstanceKey((key) => key + 1);
      toast.error(
        reason === "unverified"
          ? t("pay_verifyUncertainToast")
          : message || t("pay_declinedToast")
      );
    },
  });

  const isCardBusy = cardPhase !== "idle";

  const handleBrickSubmit = (checkout: CardCheckoutFields) => {
    submittedRemainingRef.current = remainingAmount;
    return submitCheckout(checkout);
  };

  return (
    <BottomSheet
      onClose={isCardBusy ? () => undefined : onClose}
      labelledBy="qr-bill-title"
      showCloseButton={!isCardBusy}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Receipt className="size-5" />
        </div>
        <div>
          <h2
            id="qr-bill-title"
            className="font-heading text-2xl font-bold text-foreground"
          >
            {t("bill_sheet_title")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("bill_sheet_description")}
          </p>
        </div>
      </div>

      <ul className="mt-5 max-h-48 space-y-1 overflow-y-auto border-y border-dashed border-border/70 py-3 text-sm">
        {billableOrders.flatMap((order) =>
          order.items.map((item) => (
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
          ))
        )}
      </ul>

      <FieldGroup className="mt-5">
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
            htmlFor="qr-bill-custom-tip"
            className="shrink-0 text-xs font-medium text-muted-foreground"
          >
            {t("pay_tipCustomLabel")}
          </FieldLabel>
          <TextInput
            id="qr-bill-custom-tip"
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
          <dt className="text-muted-foreground">{t("bill_sheet_total")}</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {formatMoney(remainingAmount, "CLP")}
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

      {isGatewayConnected ? (
        <div className="mt-6 space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              {t("pay_cardTitle")}
            </p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {t("pay_cardDescription")}
            </p>
          </div>

          {cardPhase === "verifying" ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-3 text-sm text-foreground">
              <Spinner className="size-4 shrink-0" />
              <span>{t("pay_verifyingDescription")}</span>
            </div>
          ) : null}

          {brickFailed ? (
            <div className="space-y-2 rounded-xl border border-destructive/25 bg-destructive/8 px-3.5 py-3 text-sm text-destructive">
              <p>{t("pay_brickLoadErrorToast")}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-lg"
                onClick={() => {
                  setBrickFailed(false);
                  setBrickInstanceKey((key) => key + 1);
                }}
              >
                {t("pay_brickRetry")}
              </Button>
            </div>
          ) : (
            <CardPaymentBrick
              key={brickInstanceKey}
              publicKey={paymentConfigQuery.data?.publicKey ?? ""}
              amount={totalDue}
              onSubmit={handleBrickSubmit}
              onError={(error) => {
                if (error.type === "critical") {
                  setBrickFailed(true);
                  toast.error(t("pay_brickLoadErrorToast"));
                }
              }}
              className={cn(isCardBusy && "pointer-events-none opacity-60")}
            />
          )}
        </div>
      ) : null}

      <div className="mt-5 space-y-2">
        {!isGatewayConnected ? (
          <Button
            type="button"
            size="lg"
            className="w-full rounded-xl"
            disabled={payBill.isPending}
            onClick={() => payBill.mutate()}
          >
            {payBill.isPending ? <Spinner /> : null}
            {t("pay_submit")}
          </Button>
        ) : null}
        <Button
          type="button"
          size="lg"
          variant="ghost"
          className="w-full rounded-xl"
          disabled={isCardBusy}
          onClick={onClose}
        >
          {t("pay_later")}
        </Button>
      </div>
    </BottomSheet>
  );
}
