"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { CardCheckoutFields } from "@/shared/types/payments";
import type {
  MercadoPagoBrickError,
  MercadoPagoCardPaymentBrickController,
  MercadoPagoCardPaymentFormData,
} from "@/shared/types/mercado-pago";
import { useMercadoPagoSdk } from "../model/use-mercado-pago-sdk";

const DEFAULT_DEBOUNCE_MS = 500;
const SDK_LOAD_ERROR_CAUSE = "sdk_load_failed";

function mapFormDataToCheckoutFields(
  formData: MercadoPagoCardPaymentFormData
): CardCheckoutFields {
  return {
    cardToken: formData.token,
    paymentMethodId: formData.payment_method_id,
    issuerId: formData.issuer_id || undefined,
    installments: formData.installments,
    payerEmail: formData.payer.email || undefined,
  };
}

export type CardPaymentBrickProps = {
  publicKey: string;
  amount: number;
  payerEmail?: string;
  onSubmit: (
    checkout: CardCheckoutFields,
    formData: MercadoPagoCardPaymentFormData
  ) => Promise<void>;
  onReady?: () => void;
  onError?: (error: MercadoPagoBrickError) => void;
  debounceMs?: number;
  className?: string;
};

type CardPaymentBrickPhase = "loading" | "ready" | "error";

export function CardPaymentBrick({
  publicKey,
  amount,
  payerEmail,
  onSubmit,
  onReady,
  onError,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  className,
}: CardPaymentBrickProps) {
  const rawContainerId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const containerId = `mp-card-payment-brick-${rawContainerId}`;
  const [phase, setPhase] = useState<CardPaymentBrickPhase>("loading");
  const [debouncedAmount, setDebouncedAmount] = useState(amount);
  const isFirstAmountRef = useRef(true);

  const onSubmitRef = useRef(onSubmit);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const payerEmailRef = useRef(payerEmail);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
    payerEmailRef.current = payerEmail;
  });

  const sdk = useMercadoPagoSdk(publicKey);

  useEffect(() => {
    if (isFirstAmountRef.current) {
      isFirstAmountRef.current = false;
      return;
    }

    const handle = setTimeout(() => {
      setDebouncedAmount(amount);
    }, debounceMs);

    return () => clearTimeout(handle);
  }, [amount, debounceMs]);

  useEffect(() => {
    if (sdk.status === "error") {
      onErrorRef.current?.({
        type: "critical",
        message: "No se pudo cargar el SDK de MercadoPago.",
        cause: SDK_LOAD_ERROR_CAUSE,
      });
    }
  }, [sdk.status]);

  const displayPhase: CardPaymentBrickPhase =
    sdk.status === "error" ? "error" : phase;

  useEffect(() => {
    const roundedAmount = Math.round(debouncedAmount);
    const mercadoPagoInstance = sdk.instance;

    if (sdk.status !== "ready" || !mercadoPagoInstance || roundedAmount <= 0) {
      return;
    }

    let cancelled = false;
    let controller: MercadoPagoCardPaymentBrickController | null = null;

    const mountBrick = async () => {
      setPhase("loading");

      try {
        const brickController = await mercadoPagoInstance.bricks().create(
          "cardPayment",
          containerId,
          {
            initialization: {
              amount: roundedAmount,
              payer: payerEmailRef.current
                ? { email: payerEmailRef.current }
                : undefined,
            },
            callbacks: {
              onReady: () => {
                if (!cancelled) {
                  setPhase("ready");
                }
                onReadyRef.current?.();
              },
              onError: (error) => {
                if (!cancelled) {
                  setPhase("error");
                }
                onErrorRef.current?.(error);
              },
              onSubmit: (cardData) =>
                onSubmitRef.current(
                  mapFormDataToCheckoutFields(cardData),
                  cardData
                ),
            },
          }
        );

        if (cancelled) {
          brickController.unmount();
          return;
        }

        controller = brickController;
      } catch (error) {
        if (!cancelled) {
          setPhase("error");
          onErrorRef.current?.({
            type: "critical",
            message:
              error instanceof Error
                ? error.message
                : "No se pudo cargar el formulario de pago.",
            cause: SDK_LOAD_ERROR_CAUSE,
          });
        }
      }
    };

    void mountBrick();

    return () => {
      cancelled = true;
      controller?.unmount();
    };
  }, [sdk.status, sdk.instance, containerId, debouncedAmount]);

  return (
    <div className={cn("relative", className)}>
      {displayPhase === "loading" ? (
        <div className="absolute inset-0 flex items-center justify-center py-8">
          <Spinner className="size-6" />
        </div>
      ) : null}
      <div
        id={containerId}
        className={cn(displayPhase === "loading" ? "opacity-0" : "opacity-100")}
      />
    </div>
  );
}
