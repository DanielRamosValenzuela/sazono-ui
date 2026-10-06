"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { paymentsApi } from "@/shared/api/payments-api";
import { formatMoney } from "@/shared/lib/format";
import { FieldGroup, FieldHint, FieldLabel, TextInput } from "@/shared/ui/form-controls";

type CounterPayDialogProps = {
  accessToken: string;
  billId: string;
  ticketNumber: number;
  remainingAmount: string;
  onClose: () => void;
};

export function CounterPayDialog({
  accessToken,
  billId,
  ticketNumber,
  remainingAmount,
  onClose,
}: CounterPayDialogProps) {
  const t = useTranslations("CounterBoard");
  const queryClient = useQueryClient();
  const remaining = Math.round(Number(remainingAmount));
  const [amount, setAmount] = useState(String(remaining));
  const [tip, setTip] = useState("");

  const amountNumber = Number(amount);
  const tipNumber = Number(tip || 0);
  const canSubmit =
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    amountNumber <= remaining &&
    Number.isFinite(tipNumber) &&
    tipNumber >= 0;

  const payMutation = useMutation({
    mutationFn: () =>
      paymentsApi.payBill(accessToken, billId, {
        amount: String(amountNumber),
        ...(tipNumber > 0 ? { tipAmount: String(tipNumber) } : {}),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["floor", "counter-sessions"] }),
        queryClient.invalidateQueries({ queryKey: ["billing"] }),
      ]);
      toast.success(t("paySuccess"));
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("payError"));
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("payTitle", { ticket: ticketNumber })}</DialogTitle>
          <DialogDescription>{t("payDescription")}</DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <FieldLabel htmlFor="counter-pay-amount">{t("payAmount")}</FieldLabel>
          <TextInput
            id="counter-pay-amount"
            type="number"
            inputMode="numeric"
            min={1}
            max={remaining}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <FieldHint>
            {t("payRemainingHint", { amount: formatMoney(remainingAmount, "CLP") })}
          </FieldHint>
          {amount !== String(remaining) ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setAmount(String(remaining))}
            >
              {t("payFull")}
            </Button>
          ) : null}
        </FieldGroup>

        <FieldGroup>
          <FieldLabel htmlFor="counter-pay-tip">{t("payTip")}</FieldLabel>
          <TextInput
            id="counter-pay-tip"
            type="number"
            inputMode="numeric"
            min={0}
            value={tip}
            onChange={(event) => setTip(event.target.value)}
          />
        </FieldGroup>

        <DialogFooter>
          <Button type="button" variant="ghost" className="rounded-full" onClick={onClose}>
            {t("payCancel")}
          </Button>
          <Button
            type="button"
            className="rounded-full"
            disabled={!canSubmit || payMutation.isPending}
            onClick={() => payMutation.mutate()}
          >
            {payMutation.isPending ? <Spinner /> : null}
            {payMutation.isPending ? t("paySubmitting") : t("paySubmit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
