"use client";

import { Building2, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getPaymentProviderLabelKey } from "@/shared/lib/payment-provider-label";
import type { QrPaymentConfigOption } from "@/shared/types/payments";

const PROVIDER_ICON = {
  MERCADO_PAGO: CreditCard,
  TRANSBANK: Building2,
} as const;

type PaymentMethodOptionsProps = {
  options: QrPaymentConfigOption[];
  selectedProvider: string | null;
  disabled?: boolean;
  onSelect: (option: QrPaymentConfigOption) => void;
};

export function PaymentMethodOptions({
  options,
  selectedProvider,
  disabled = false,
  onSelect,
}: PaymentMethodOptionsProps) {
  const t = useTranslations("QrPage");

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const Icon = PROVIDER_ICON[option.provider];
        const selected = option.provider === selectedProvider;

        return (
          <button
            key={option.provider}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option)}
            className={cn(
              "flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
              selected
                ? "border-primary bg-primary/5"
                : "border-border/80 bg-background/60 hover:bg-muted",
              disabled && "pointer-events-none opacity-60"
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {t(`pay_provider${getPaymentProviderLabelKey(option.provider)}`)}
              </span>
              {option.isPreferred ? (
                <span className="block text-xs text-muted-foreground">
                  {t("pay_preferredBadge")}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
