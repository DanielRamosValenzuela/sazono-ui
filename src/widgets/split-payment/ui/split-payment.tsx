"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, HandCoins, QrCode, SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { CardPaymentBrick } from "@/features/mercado-pago-checkout/ui/card-payment-brick";
import { useCardCheckoutPayment } from "@/features/mercado-pago-checkout/model/use-card-checkout-payment";
import { qrApi } from "@/shared/api/qr-api";
import { formatMoney } from "@/shared/lib/format";
import { useClientReady } from "@/shared/lib/use-client-ready";
import type { CardCheckoutFields } from "@/shared/types/payments";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { FieldGroup, FieldLabel, TextInput } from "@/shared/ui/form-controls";
import { cn } from "@/lib/utils";

const TIP_PERCENTAGES = [0, 5, 10] as const;
const PAYABLE_STATUSES = ["PENDING", "PARTIALLY_PAID", "FAILED"];

type SplitPaymentProps = {
  participantToken?: string;
};

function StatusScreen({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 text-foreground">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <h1 className="font-heading text-2xl font-bold">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </main>
  );
}

export function SplitPayment({ participantToken }: SplitPaymentProps) {
  const t = useTranslations("SplitPayment");
  const isClientReady = useClientReady();
  const [tipPercentage, setTipPercentage] = useState<number>(0);
  const [customTip, setCustomTip] = useState("");
  const [useCustomTip, setUseCustomTip] = useState(false);
  const [brickInstanceKey, setBrickInstanceKey] = useState(0);
  const [brickFailed, setBrickFailed] = useState(false);

  const participantQuery = useQuery({
    queryKey: ["split-participant", participantToken],
    queryFn: () => qrApi.getBillSplitParticipant(participantToken as string),
    enabled: Boolean(participantToken) && isClientReady,
    retry: false,
  });

  const participant = participantQuery.data;
  const remaining = participant
    ? Number(participant.allocatedAmount) - Number(participant.paidAmount)
    : 0;
  const tipAmount = useCustomTip
    ? Math.max(0, Math.floor(Number(customTip) || 0))
    : Math.round((remaining * tipPercentage) / 100);
  const totalDue = remaining + tipAmount;
  const isGatewayConnected = Boolean(
    participant?.gatewayConnected && participant.publicKey
  );

  const submittedPaidAmountRef = useRef(0);

  const payMutation = useMutation({
    mutationFn: (tipAmountToPay: number) =>
      qrApi.payBillSplitParticipant(participantToken as string, {
        ...(tipAmountToPay > 0 ? { tipAmount: String(tipAmountToPay) } : {}),
      }),
    onSuccess: () => {
      toast.success(t("paySuccessToast"));
      void participantQuery.refetch();
    },
    onError: () => {
      toast.error(t("payErrorToast"));
    },
  });

  const { phase: cardPhase, submitCheckout } = useCardCheckoutPayment({
    submit: (checkout, signal) =>
      qrApi
        .payBillSplitParticipant(
          participantToken as string,
          {
            ...(tipAmount > 0 ? { tipAmount: String(tipAmount) } : {}),
            ...checkout,
          },
          signal
        )
        .then(() => undefined),
    pollStatus: async () => {
      const result = await participantQuery.refetch();

      if (
        result.data &&
        Number(result.data.paidAmount) > submittedPaidAmountRef.current
      ) {
        return "approved";
      }

      return "unresolved";
    },
    onApproved: () => {
      toast.success(t("paySuccessToast"));
      void participantQuery.refetch();
    },
    onDeclined: (reason, message) => {
      setBrickInstanceKey((key) => key + 1);
      toast.error(
        reason === "unverified"
          ? t("payVerifyUncertainToast")
          : message || t("payDeclinedToast")
      );
    },
  });

  const isCardBusy = cardPhase !== "idle";

  const handleBrickSubmit = (checkout: CardCheckoutFields) => {
    if (participant) {
      submittedPaidAmountRef.current = Number(participant.paidAmount);
    }

    return submitCheckout(checkout);
  };

  if (!participantToken) {
    return (
      <StatusScreen
        icon={<QrCode className="size-7" />}
        title={t("noToken_title")}
        description={t("noToken_description")}
      />
    );
  }

  if (participantQuery.isPending) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-md px-5 pt-6 text-foreground">
        <Skeleton className="mt-6 h-9 w-56" />
        <Skeleton className="mt-6 h-40 w-full rounded-2xl" />
      </main>
    );
  }

  if (participantQuery.isError) {
    return (
      <StatusScreen
        icon={<SearchX className="size-7" />}
        title={t("error_title")}
        description={t("error_description")}
      />
    );
  }

  if (!participant) {
    return null;
  }

  const isPayable = PAYABLE_STATUSES.includes(participant.status) && remaining > 0;

  if (!isPayable) {
    return (
      <StatusScreen
        icon={<CheckCircle2 className="size-7" />}
        title={t("paid_title")}
        description={t("paid_description")}
      />
    );
  }

  return (
    <div className="min-h-dvh text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-5">
        <div className="flex items-center justify-between gap-3">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>

        <div className="mt-8 flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HandCoins className="size-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {t("title", {
                name: participant.displayName || t("guestFallback"),
              })}
            </h1>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("description")}
            </p>
          </div>
        </div>

        <FieldGroup className="mt-8">
          <FieldLabel>{t("tipLabel")}</FieldLabel>
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
                  className={
                    selected
                      ? "cursor-pointer rounded-xl border border-primary bg-primary px-2 py-2.5 text-sm font-semibold text-primary-foreground transition-colors"
                      : "cursor-pointer rounded-xl border border-border/80 bg-background/60 px-2 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  }
                >
                  {percentage === 0 ? t("tipNone") : `${percentage}%`}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <FieldLabel
              htmlFor="split-custom-tip"
              className="shrink-0 text-xs font-medium text-muted-foreground"
            >
              {t("tipCustomLabel")}
            </FieldLabel>
            <TextInput
              id="split-custom-tip"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={t("tipCustomPlaceholder")}
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
            <dt className="text-muted-foreground">{t("yourShare")}</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {formatMoney(remaining, "CLP")}
            </dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground">{t("tip")}</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {formatMoney(tipAmount, "CLP")}
            </dd>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <dt className="text-base font-medium text-foreground">{t("totalDue")}</dt>
            <dd className="font-heading text-2xl font-bold text-foreground">
              {formatMoney(totalDue, "CLP")}
            </dd>
          </div>
        </dl>

        {isGatewayConnected ? (
          <div className="mt-6 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("cardTitle")}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                {t("cardDescription")}
              </p>
            </div>

            {cardPhase === "verifying" ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-3 text-sm text-foreground">
                <Spinner className="size-4 shrink-0" />
                <span>{t("verifyingDescription")}</span>
              </div>
            ) : null}

            {brickFailed ? (
              <div className="space-y-2 rounded-xl border border-destructive/25 bg-destructive/8 px-3.5 py-3 text-sm text-destructive">
                <p>{t("brickLoadErrorToast")}</p>
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
                  {t("brickRetry")}
                </Button>
              </div>
            ) : (
              <CardPaymentBrick
                key={brickInstanceKey}
                publicKey={participant.publicKey ?? ""}
                amount={totalDue}
                onSubmit={handleBrickSubmit}
                onError={(error) => {
                  if (error.type === "critical") {
                    setBrickFailed(true);
                    toast.error(t("brickLoadErrorToast"));
                  }
                }}
                className={cn(isCardBusy && "pointer-events-none opacity-60")}
              />
            )}
          </div>
        ) : null}

        {!isGatewayConnected ? (
          <Button
            type="button"
            size="lg"
            className="mt-6 w-full rounded-xl"
            disabled={payMutation.isPending}
            onClick={() => payMutation.mutate(tipAmount)}
          >
            {payMutation.isPending ? <Spinner /> : null}
            {t("paySubmit")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
