"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cashApi } from "@/shared/api/cash-api";
import { formatMoney } from "@/shared/lib/format";
import type { CashCloseResult, CashSession } from "@/shared/types/cash";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextArea,
  TextInput,
} from "@/shared/ui/form-controls";
import {
  DENOMINATIONS,
  digitsOnly,
  errorMessage,
  newIdempotencyKey,
  sumDenominations,
} from "./cash-helpers";

type SheetBase = {
  token: string;
  branchId: string;
  onClose: () => void;
};

export function MovementSheet({ token, branchId, onClose }: SheetBase) {
  const t = useTranslations("CashRegister");
  const queryClient = useQueryClient();
  const [type, setType] = useState<"CASH_IN" | "CASH_OUT">("CASH_OUT");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [idempotencyKey] = useState(newIdempotencyKey);

  const mutation = useMutation({
    mutationFn: () =>
      cashApi.createMovement(token, branchId, idempotencyKey, {
        type,
        amount,
        reason: reason.trim(),
      }),
    onSuccess: async () => {
      toast.success(t("movementSaved"));
      await queryClient.invalidateQueries({ queryKey: ["cash"] });
      onClose();
    },
    onError: (error) => toast.error(errorMessage(error, t("genericError"))),
  });

  const valid = Number(amount) > 0 && reason.trim().length >= 3;

  return (
    <BottomSheet onClose={onClose} labelledBy="cash-movement-title">
      <div className="space-y-4">
        <h2 id="cash-movement-title" className="pr-8 text-lg font-semibold">
          {t("movementTitle")}
        </h2>
        <FieldGroup>
          <FieldLabel htmlFor="cash-movement-type">
            {t("movementType")}
          </FieldLabel>
          <SelectInput
            id="cash-movement-type"
            value={type}
            onChange={(event) =>
              setType(event.target.value as "CASH_IN" | "CASH_OUT")
            }
          >
            <option value="CASH_OUT">{t("cashOut")}</option>
            <option value="CASH_IN">{t("cashIn")}</option>
          </SelectInput>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="cash-movement-amount">{t("amount")}</FieldLabel>
          <TextInput
            id="cash-movement-amount"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(digitsOnly(event.target.value))}
            placeholder="5000"
          />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="cash-movement-reason">{t("reason")}</FieldLabel>
          <TextArea
            id="cash-movement-reason"
            value={reason}
            maxLength={300}
            rows={2}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("reasonPlaceholder")}
          />
          <FieldHint>{t("reasonHint")}</FieldHint>
        </FieldGroup>
        <Button
          size="lg"
          className="w-full"
          disabled={!valid || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? <Spinner /> : t("saveMovement")}
        </Button>
      </div>
    </BottomSheet>
  );
}

type CloseSheetProps = SheetBase & {
  session: CashSession;
  forced: boolean;
};

export function CloseSheet({
  token,
  branchId,
  session,
  forced,
  onClose,
}: CloseSheetProps) {
  const t = useTranslations("CashRegister");
  const tc = useTranslations("ConfirmActions.money");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");
  const [showDenominations, setShowDenominations] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [result, setResult] = useState<CashCloseResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const expected = Number(session.expectedCash);
  const difference = counted === "" ? null : Number(counted) - expected;
  const noteRequired = !forced && (difference !== null && difference !== 0);

  const setCount = (value: number, count: number) => {
    const next = { ...counts, [String(value)]: Math.max(0, count) };
    setCounts(next);
    setCounted(String(sumDenominations(next)));
  };

  const mutation = useMutation({
    mutationFn: (forceReason?: string) => {
      const payload = {
        countedCash: counted,
        closingNote: (forced ? forceReason : note.trim()) || undefined,
        denominations:
          showDenominations && sumDenominations(counts) > 0
            ? Object.fromEntries(
                Object.entries(counts).filter(([, count]) => count > 0),
              )
            : undefined,
      };
      return forced
        ? cashApi.forceClose(token, branchId, session.id, payload)
        : cashApi.close(token, branchId, session.id, payload);
    },
    onSuccess: async (data) => {
      setResult(data);
      await queryClient.invalidateQueries({ queryKey: ["cash"] });
    },
    onError: (error) => toast.error(errorMessage(error, t("genericError"))),
  });

  const confirmClose = async (reason?: string) => {
    try {
      await mutation.mutateAsync(reason);
      setConfirmOpen(false);
    } catch {
      return;
    }
  };

  if (result) {
    const closedDifference = Number(result.session.difference ?? 0);

    return (
      <BottomSheet onClose={onClose} labelledBy="cash-close-title">
        <div className="space-y-4">
          <h2 id="cash-close-title" className="pr-8 text-lg font-semibold">
            {t("closedTitle")}
          </h2>
          <dl className="space-y-2 text-sm">
            <Row
              label={t("expected")}
              value={formatMoney(result.session.expectedCash)}
            />
            <Row
              label={t("counted")}
              value={formatMoney(result.session.countedCash ?? 0)}
            />
            <Row
              label={t("difference")}
              value={formatMoney(closedDifference)}
              tone={closedDifference === 0 ? "ok" : "bad"}
              strong
            />
          </dl>
          <p className="text-sm text-muted-foreground">
            {closedDifference === 0
              ? t("differenceOk")
              : closedDifference < 0
                ? t("differenceShort")
                : t("differenceOver")}
          </p>
          {result.warnings.openBills > 0 ? (
            <p className="rounded-xl bg-amber-500/12 p-3 text-sm text-amber-800 dark:text-amber-200">
              {t("warningOpenBills", {
                count: result.warnings.openBills,
                partial: result.warnings.partialBillsCollectedInSession,
              })}
            </p>
          ) : null}
          <Button size="lg" className="w-full" onClick={onClose}>
            {t("done")}
          </Button>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet onClose={onClose} labelledBy="cash-close-title">
      <div className="space-y-4">
        <h2 id="cash-close-title" className="pr-8 text-lg font-semibold">
          {forced ? t("forceCloseTitle") : t("closeTitle")}
        </h2>
        {forced ? (
          <p className="text-sm text-muted-foreground">
            {t("forceCloseHint", { name: session.cashierName ?? "-" })}
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {t("closeHint", {
            openedAt: new Date(session.openedAt).toLocaleString(locale),
          })}
        </p>
        <FieldGroup>
          <FieldLabel htmlFor="cash-counted">{t("countedLabel")}</FieldLabel>
          <TextInput
            id="cash-counted"
            inputMode="numeric"
            value={counted}
            readOnly={showDenominations}
            onChange={(event) => setCounted(digitsOnly(event.target.value))}
            placeholder="0"
          />
          {showDenominations ? (
            <p className="text-xs text-muted-foreground">
              {t("countedFromDenominations")}
            </p>
          ) : null}
        </FieldGroup>
        <button
          type="button"
          className="min-h-10 text-sm font-medium text-primary underline-offset-4 hover:underline"
          onClick={() => setShowDenominations((value) => !value)}
        >
          {showDenominations ? t("hideDenominations") : t("showDenominations")}
        </button>
        {showDenominations ? (
          <div className="grid grid-cols-2 gap-2">
            {DENOMINATIONS.map((value) => (
              <label
                key={value}
                className="flex items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-1.5 text-sm"
              >
                <span>{formatMoney(value)}</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  aria-label={formatMoney(value)}
                  className="h-10 w-16 rounded-lg border border-border bg-background px-2 text-right"
                  value={counts[String(value)] ?? ""}
                  onChange={(event) =>
                    setCount(value, Number(event.target.value) || 0)
                  }
                />
              </label>
            ))}
          </div>
        ) : null}
        {difference !== null ? (
          <div
            className={`rounded-xl p-3 text-sm ${
              difference === 0
                ? "bg-emerald-500/12 text-emerald-800 dark:text-emerald-200"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {difference === 0
              ? t("differenceOk")
              : t("differencePreview", { amount: formatMoney(difference) })}
          </div>
        ) : null}
        {noteRequired ? (
          <FieldGroup>
            <FieldLabel htmlFor="cash-note">{t("noteLabel")}</FieldLabel>
            <TextArea
              id="cash-note"
              rows={2}
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </FieldGroup>
        ) : null}
        <Button
          size="lg"
          className="w-full"
          disabled={
            counted === "" ||
            (noteRequired && note.trim().length < 3) ||
            mutation.isPending
          }
          onClick={() => setConfirmOpen(true)}
        >
          {forced ? t("forceCloseAction") : t("closeAction")}
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          tone="destructive"
          requireReason={forced}
          isPending={mutation.isPending}
          title={tc(forced ? "cash-force-close.title" : "cash-close-register.title")}
          description={tc(
            forced
              ? "cash-force-close.description"
              : "cash-close-register.description",
          )}
          confirmLabel={tc(
            forced ? "cash-force-close.confirm" : "cash-close-register.confirm",
          )}
          impact={
            difference === null
              ? undefined
              : forced
                ? tc("cash-force-close.impact", {
                    name: session.cashierName ?? "-",
                    openedAt: new Date(session.openedAt).toLocaleString(locale),
                    expected: formatMoney(expected),
                    counted: formatMoney(counted),
                    difference: formatMoney(difference),
                  })
                : (
                    <>
                      {tc("cash-close-register.impact", {
                        expected: formatMoney(expected),
                        counted: formatMoney(counted),
                        difference: formatMoney(difference),
                      })}
                      {note.trim() ? (
                        <span className="mt-1 block break-words">
                          {tc("cash-close-register.noteLine", {
                            note: note.trim(),
                          })}
                        </span>
                      ) : null}
                    </>
                  )
          }
          onConfirm={confirmClose}
        />
      </div>
    </BottomSheet>
  );
}

export function Row({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: string;
  tone?: "ok" | "bad";
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={`${strong ? "font-semibold" : ""} ${
          tone === "bad"
            ? "text-destructive"
            : tone === "ok"
              ? "text-emerald-700 dark:text-emerald-300"
              : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
