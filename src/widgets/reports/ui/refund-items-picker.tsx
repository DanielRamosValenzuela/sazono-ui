"use client";

import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/shared/lib/format";
import type { RefundableBillItem } from "@/shared/types/refunds";
import { CheckboxRow } from "@/shared/ui/form-controls";

type RefundItemsPickerProps = {
  lines: RefundableBillItem[];
  quantities: Record<string, number>;
  waste: Record<string, boolean>;
  disabled: boolean;
  onQuantity: (billItemId: string, quantity: number) => void;
  onWaste: (billItemId: string, value: boolean) => void;
};

export function RefundItemsPicker({
  lines,
  quantities,
  waste,
  disabled,
  onQuantity,
  onWaste,
}: RefundItemsPickerProps) {
  const t = useTranslations("Refunds");

  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("itemsEmpty")}</p>;
  }

  return (
    <ul className="space-y-2" aria-label={t("itemsTitle")}>
      {lines.map((line) => {
        const quantity = quantities[line.billItemId] ?? 0;
        const exhausted = line.availableQuantity <= 0;

        return (
          <li
            key={line.billItemId}
            className={cn(
              "space-y-2 rounded-xl border border-border/70 p-3",
              quantity > 0 && "border-primary/50 bg-primary/5",
              exhausted && "opacity-60",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-medium">{line.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t("itemsAvailable", {
                    available: line.availableQuantity,
                    total: line.quantity,
                  })}{" "}
                  · {formatMoney(line.unitRefundAmount)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-10 rounded-full"
                  aria-label={t("itemsDecrease", { name: line.name })}
                  disabled={disabled || quantity <= 0}
                  onClick={() => onQuantity(line.billItemId, quantity - 1)}
                >
                  <Minus className="size-4" aria-hidden="true" />
                </Button>
                <span
                  className="w-8 text-center font-semibold tabular-nums"
                  aria-live="polite"
                >
                  {quantity}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-10 rounded-full"
                  aria-label={t("itemsIncrease", { name: line.name })}
                  disabled={disabled || quantity >= line.availableQuantity}
                  onClick={() => onQuantity(line.billItemId, quantity + 1)}
                >
                  <Plus className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
            {quantity > 0 ? (
              <CheckboxRow className="py-3 sm:py-2.5">
                <input
                  type="checkbox"
                  className="size-5 cursor-pointer sm:size-4"
                  checked={waste[line.billItemId] ?? false}
                  disabled={disabled}
                  onChange={(event) =>
                    onWaste(line.billItemId, event.target.checked)
                  }
                />
                <span>{t("itemsWaste")}</span>
              </CheckboxRow>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
