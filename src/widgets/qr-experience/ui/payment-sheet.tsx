"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, HandCoins } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CardPaymentBrick } from "@/features/mercado-pago-checkout/ui/card-payment-brick";
import { useCardCheckoutPayment } from "@/features/mercado-pago-checkout/model/use-card-checkout-payment";
import { PaymentMethodOptions } from "@/features/payment-method-picker/ui/payment-method-options";
import { ApiError } from "@/shared/api/http-client";
import { qrApi } from "@/shared/api/qr-api";
import { formatMoney } from "@/shared/lib/format";
import { getPaymentProviderLabelKey } from "@/shared/lib/payment-provider-label";
import { setPaymentRedirectReturnPath } from "@/shared/lib/payment-redirect-return-path";
import { submitRedirectPaymentForm } from "@/shared/lib/redirect-payment-form";
import type { OrderResponse } from "@/shared/types/order";
import type {
  CardCheckoutFields,
  PaymentGatewayProvider,
  QrPaymentConfigOption,
} from "@/shared/types/payments";
import { FieldGroup, FieldLabel } from "@/shared/ui/form-controls";
import { TextInput } from "@/shared/ui/form-controls";
import { cn } from "@/lib/utils";
import { BottomSheet } from "@/shared/ui/bottom-sheet";

const TIP_PERCENTAGES = [0, 5, 10] as const;
const AWAITING_ORDER_STATUSES = ["AWAITING_PAYMENT", "PAYMENT_FAILED"];

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
  const [brickInstanceKey, setBrickInstanceKey] = useState(0);
  const [brickFailed, setBrickFailed] = useState(false);
  const [chosenProvider, setChosenProvider] =
    useState<PaymentGatewayProvider | null>(null);

  const isRetry = order.status === "PAYMENT_FAILED";
  const orderTotal = Number(order.orderTotalAmount);
  const tipAmount = useCustomTip
    ? Math.max(0, Math.floor(Number(customTip) || 0))
    : Math.round((orderTotal * tipPercentage) / 100);
  const totalDue = orderTotal + tipAmount;

  const paymentConfigQuery = useQuery({
    queryKey: ["qr-payment-config", qrToken],
    queryFn: () => qrApi.getPaymentConfig(qrToken),
  });

  const options = paymentConfigQuery.data?.options ?? [];
  const showPicker = options.length > 1;
  const activeOption: QrPaymentConfigOption | null = chosenProvider
    ? (options.find((option) => option.provider === chosenProvider) ?? null)
    : options.length === 1
      ? options[0]
      : null;

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

  const startRedirect = useMutation({
    mutationFn: (provider: PaymentGatewayProvider) =>
      qrApi.startOrderRedirectPayment(qrToken, order.orderId, {
        provider,
        ...(tipAmount > 0 ? { tipAmount: String(tipAmount) } : {}),
      }),
    onSuccess: (response) => {
      setPaymentRedirectReturnPath(`/qr?table=${encodeURIComponent(qrToken)}`);
      submitRedirectPaymentForm(
        response.redirectUrl,
        response.method,
        response.fields
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : t("pay_redirectErrorToast")
      );
    },
  });

  const { phase: cardPhase, submitCheckout } = useCardCheckoutPayment({
    submit: (checkout, signal) =>
      qrApi
        .payOrder(
          qrToken,
          order.orderId,
          {
            ...(tipAmount > 0 ? { tipAmount: String(tipAmount) } : {}),
            ...checkout,
          },
          signal
        )
        .then(() => undefined),
    pollStatus: async () => {
      if (order.status === "PAYMENT_FAILED") {
        return "declined";
      }

      if (!AWAITING_ORDER_STATUSES.includes(order.status)) {
        return "approved";
      }

      const status = await qrApi.getOrderPaymentStatus(
        qrToken,
        order.orderId
      );

      if (status.orderStatus === "PAYMENT_FAILED") {
        return "declined";
      }

      if (!AWAITING_ORDER_STATUSES.includes(status.orderStatus)) {
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
  const isBusy = isCardBusy || startRedirect.isPending;

  const handleBrickSubmit = (checkout: CardCheckoutFields) =>
    submitCheckout(checkout);

  const handleSelectOption = (option: QrPaymentConfigOption) => {
    setChosenProvider(option.provider);

    if (option.checkoutMode === "redirect") {
      startRedirect.mutate(option.provider);
    }
  };

  return (
    <BottomSheet
      onClose={isBusy ? () => undefined : onClose}
      labelledBy="qr-pay-title"
      showCloseButton={!isBusy}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            isRetry ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}
        >
          {isRetry ? <AlertTriangle className="size-5" /> : <HandCoins className="size-5" />}
        </div>
        <div>
          <h2
            id="qr-pay-title"
            className="font-heading text-2xl font-bold text-foreground"
          >
            {isRetry ? t("pay_retryTitle") : t("pay_title")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {isRetry ? t("pay_retryDescription") : t("pay_description")}
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

      {options.length > 0 ? (
        <div className="mt-6 space-y-3">
          {showPicker ? (
            <>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t("pay_chooseMethodTitle")}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  {t("pay_chooseMethodDescription")}
                </p>
              </div>
              <PaymentMethodOptions
                options={options}
                selectedProvider={activeOption?.provider ?? null}
                disabled={isBusy}
                onSelect={handleSelectOption}
              />
            </>
          ) : null}

          {activeOption?.checkoutMode === "embedded" ? (
            <div className="space-y-3">
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
                  publicKey={activeOption.publicKey ?? ""}
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

          {activeOption?.checkoutMode === "redirect" ? (
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t("pay_redirectTitle", {
                    provider: t(
                      `pay_provider${getPaymentProviderLabelKey(activeOption.provider)}`
                    ),
                  })}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  {t("pay_redirectDescription")}
                </p>
              </div>
              <Button
                type="button"
                size="lg"
                className="w-full rounded-xl"
                disabled={startRedirect.isPending}
                onClick={() => startRedirect.mutate(activeOption.provider)}
              >
                {startRedirect.isPending ? <Spinner /> : null}
                {startRedirect.isPending
                  ? t("pay_redirectPending")
                  : t("pay_redirectSubmit", {
                      provider: t(
                        `pay_provider${getPaymentProviderLabelKey(activeOption.provider)}`
                      ),
                    })}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 space-y-2">
        {options.length === 0 ? (
          <Button
            type="button"
            size="lg"
            className="w-full rounded-xl"
            disabled={payOrder.isPending}
            onClick={() => payOrder.mutate()}
          >
            {payOrder.isPending ? <Spinner /> : null}
            {isRetry ? t("pay_retrySubmit") : t("pay_submit")}
          </Button>
        ) : null}
        <Button
          type="button"
          size="lg"
          variant="ghost"
          className="w-full rounded-xl"
          disabled={isBusy}
          onClick={onClose}
        >
          {t("pay_later")}
        </Button>
      </div>
    </BottomSheet>
  );
}
