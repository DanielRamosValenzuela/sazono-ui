"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, CircleAlert, TriangleAlert } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/shared/api/http-client";
import { refundsApi } from "@/shared/api/refunds-api";
import { formatMoney } from "@/shared/lib/format";
import type { OrderDetailPayment } from "@/shared/types/reports";
import {
  REFUND_REASON_CODES,
  REFUND_REASON_MAX_LENGTH,
  REFUND_REASON_MIN_LENGTH,
  type CreateRefundRequest,
  type RefundApprovalRequirement,
  type RefundReasonCode,
  type RefundResult,
} from "@/shared/types/refunds";
import {
  CheckboxRow,
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import { DetailGrid } from "./report-parts";

type RefundDialogProps = {
  token: string | null;
  branchId: string;
  payment: OrderDetailPayment | null;
  orderNumber: string | null;
  onClose: () => void;
};

const AMOUNT_PATTERN = /^[1-9]\d{0,9}$/;
const PIN_PATTERN = /^\d{4,6}$/;
const INVISIBLE_PATTERN = /[\s​-‍⁠﻿]/g;
const CONTROL_PATTERN = /\p{Cc}/u;
const APPROVAL_ERROR_CODES = [
  "REFUND_PIN_INVALID",
  "REFUND_PIN_LOCKED",
  "REFUND_APPROVER_INVALID",
  "REFUND_APPROVAL_BLOCKED",
];

function newIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function errorDetails(error: unknown) {
  if (!(error instanceof ApiError)) {
    return { status: 0, code: null, payload: null };
  }

  const payload =
    typeof error.details === "object" && error.details !== null
      ? (error.details as Record<string, unknown>)
      : null;

  return {
    status: error.status,
    code: typeof payload?.code === "string" ? payload.code : null,
    payload,
  };
}

export function RefundDialog({
  token,
  branchId,
  payment,
  orderNumber,
  onClose,
}: RefundDialogProps) {
  const t = useTranslations("Refunds");
  const [pending, setPending] = useState(false);

  return (
    <Dialog
      open={payment !== null}
      onOpenChange={(open) => !open && !pending && onClose()}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader className="pr-8">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {orderNumber
              ? t("description", { order: orderNumber })
              : t("descriptionGeneric")}
          </DialogDescription>
        </DialogHeader>
        {payment ? (
          <RefundForm
            key={payment.id}
            token={token}
            branchId={branchId}
            payment={payment}
            onClose={onClose}
            onPendingChange={setPending}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type RefundFormProps = {
  token: string | null;
  branchId: string;
  payment: OrderDetailPayment;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
};

function RefundForm({
  token,
  branchId,
  payment,
  onClose,
  onPendingChange,
}: RefundFormProps) {
  const t = useTranslations("Refunds");
  const tReports = useTranslations("Reports");
  const queryClient = useQueryClient();
  const [idempotencyKey] = useState(newIdempotencyKey);
  const [amount, setAmount] = useState("");
  const [reasonCode, setReasonCode] = useState<RefundReasonCode | "">("");
  const [reasonText, setReasonText] = useState("");
  const [tipChoice, setTipChoice] = useState<boolean | null>(null);
  const [approval, setApproval] = useState<RefundApprovalRequirement | null>(
    null
  );
  const [approverId, setApproverId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RefundResult | null>(null);

  const stateQuery = useQuery({
    queryKey: ["reports", "refund-state", branchId, payment.id],
    enabled: Boolean(token),
    staleTime: 0,
    gcTime: 0,
    retry: false,
    queryFn: () => refundsApi.listForPayment(token!, branchId, payment.id),
  });
  const state = stateQuery.data;
  const refundable = state?.payment.refundable;
  const tipAvailable = Number(refundable?.tip ?? 0) > 0;
  const tipOn =
    tipAvailable && (tipChoice ?? state?.settings.refundTipDefault ?? false);
  const maxAmount = Number(
    (tipOn ? refundable?.total : refundable?.consumption) ?? 0
  );
  const amountValue = AMOUNT_PATTERN.test(amount) ? Number(amount) : null;
  const amountError =
    amount !== "" && (amountValue === null || amountValue > maxAmount);
  const reasonTrimmed = reasonText.trim();
  const reasonValid =
    reasonTrimmed.length >= REFUND_REASON_MIN_LENGTH &&
    reasonTrimmed.length <= REFUND_REASON_MAX_LENGTH &&
    reasonTrimmed.replace(INVISIBLE_PATTERN, "").length >=
      REFUND_REASON_MIN_LENGTH &&
    !CONTROL_PATTERN.test(reasonTrimmed);
  const approvalReady = approval === null || (approverId !== "" && PIN_PATTERN.test(pin));
  const method = state?.eligibility.method ?? null;
  const allowed = state?.eligibility.allowed ?? false;
  const canSubmit =
    allowed &&
    amountValue !== null &&
    amountValue <= maxAmount &&
    reasonCode !== "" &&
    reasonValid &&
    approvalReady;

  const errorMessage = (code: string | null, status: number) => {
    if (code && t.has(`errors.${code}`)) {
      return t(`errors.${code}`);
    }

    if (status === 0) {
      return t("errors.network");
    }

    if (status === 400) {
      return t("errors.validation");
    }

    if (status === 403) {
      return t("errors.forbidden");
    }

    return t("errors.generic");
  };

  const mutation = useMutation({
    mutationFn: () => {
      const body: CreateRefundRequest = {
        amount,
        reasonCode: reasonCode as RefundReasonCode,
        reasonText: reasonTrimmed,
        refundTip: tipOn,
        ...(approval ? { approverStaffUserId: approverId, approverPin: pin } : {}),
      };

      return refundsApi.create(
        token!,
        branchId,
        payment.id,
        idempotencyKey,
        body
      );
    },
    onSuccess: (data) => {
      setResult(data);
      setError(null);
      toast.success(
        t(
          data.idempotentReplay ? "toastReplay" : "toastSuccess",
          { amount: formatMoney(data.refund.amount) }
        )
      );
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "branch-analytics"],
      });
    },
    onError: (failure) => {
      const { status, code, payload } = errorDetails(failure);

      if (code === "REFUND_NEEDS_APPROVAL" && payload) {
        const approvers = Array.isArray(payload.approvers)
          ? (payload.approvers as RefundApprovalRequirement["approvers"])
          : [];

        setApproval({
          limit: String(payload.limit ?? "0"),
          dayRefunded: String(payload.dayRefunded ?? "0"),
          requiredTotal: String(payload.requiredTotal ?? "0"),
          approvers,
        });
        setApproverId(approvers.length === 1 ? approvers[0].staffUserId : "");
        setPin("");
        setError(null);
        return;
      }

      if (code && APPROVAL_ERROR_CODES.includes(code)) {
        setPin("");
      }

      if (status === 400 || status === 409) {
        void stateQuery.refetch();
      }

      setError(errorMessage(code, status));
    },
  });

  const isPending = mutation.isPending;

  useEffect(() => {
    onPendingChange(isPending);

    return () => onPendingChange(false);
  }, [isPending, onPendingChange]);

  const resetApproval = () => {
    setApproval(null);
    setApproverId("");
    setPin("");
  };

  const submit = () => {
    if (!canSubmit || mutation.isPending) {
      return;
    }

    setError(null);
    mutation.mutate();
  };

  if (result) {
    return (
      <div className="space-y-4">
        <div
          role="status"
          className="space-y-2 rounded-2xl border border-border/70 bg-muted/40 p-4"
        >
          <p className="font-semibold">
            {t(result.idempotentReplay ? "doneReplay" : "done", {
              amount: formatMoney(result.refund.amount),
            })}
          </p>
          {result.cashToHandOver !== null ? (
            <p className="flex items-center gap-2 text-base font-semibold">
              <Banknote className="size-5 shrink-0" aria-hidden="true" />
              {t("cashToHandOver", {
                amount: formatMoney(result.cashToHandOver),
              })}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("externalDone")}
            </p>
          )}
          {result.billActiveOrders > 0 ? (
            <p className="flex items-start gap-2 text-sm text-destructive">
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              {t("activeOrders", { count: result.billActiveOrders })}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button className="rounded-full" onClick={onClose}>
            {t("close")}
          </Button>
        </DialogFooter>
      </div>
    );
  }

  if (stateQuery.isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  if (stateQuery.isError || !state || !refundable) {
    const { status, code } = errorDetails(stateQuery.error);

    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/25 bg-destructive/8 px-6 py-8 text-center"
      >
        <CircleAlert className="size-6 text-destructive" aria-hidden="true" />
        <p className="font-semibold text-destructive">
          {errorMessage(code, status)}
        </p>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => void stateQuery.refetch()}
        >
          {t("retry")}
        </Button>
      </div>
    );
  }

  const methodLabel = tReports(`methods.${payment.method}`);
  const isGateway = state.payment.provider !== "MANUAL";
  const nothingLeft = Number(refundable.total) <= 0;
  const deniedMessage = state.eligibility.deniedCode
    ? t.has(`denied.${state.eligibility.deniedCode}`)
      ? t(`denied.${state.eligibility.deniedCode}`)
      : (state.eligibility.deniedMessage ?? t("errors.forbidden"))
    : null;
  const fieldsDisabled = !allowed || nothingLeft || mutation.isPending;
  const fullLabel = t("fillMax", { amount: formatMoney(maxAmount) });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <DetailGrid
        className="rounded-2xl border border-border/70 bg-muted/40 p-4"
        items={[
          [t("summaryMethod"), methodLabel],
          [t("summaryCharged"), formatMoney(state.payment.amount)],
          [t("summaryTip"), formatMoney(state.payment.tipAmount)],
          [t("summaryRefunded"), formatMoney(state.payment.refundedAmount)],
          [
            t("summaryMax"),
            t("summaryMaxValue", {
              total: formatMoney(refundable.total),
              consumption: formatMoney(refundable.consumption),
              tip: formatMoney(refundable.tip),
            }),
          ],
        ]}
      />

      {deniedMessage ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {deniedMessage}
        </p>
      ) : nothingLeft ? (
        <p className="text-sm text-muted-foreground">{t("nothingLeft")}</p>
      ) : method === "MANUAL_EXTERNAL" ? (
        <p
          role="note"
          className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm"
        >
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <span>
            {isGateway
              ? t("noticeGateway", { provider: state.payment.provider })
              : t("noticeExternal")}
          </span>
        </p>
      ) : null}

      <FieldGroup>
        <FieldLabel htmlFor="refund-amount">{t("amountLabel")}</FieldLabel>
        <div className="flex gap-2">
          <TextInput
            id="refund-amount"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={amount}
            disabled={fieldsDisabled}
            aria-invalid={amountError}
            aria-describedby="refund-amount-hint"
            onChange={(event) => {
              setAmount(event.target.value.replace(/\D/g, "").slice(0, 10));
              resetApproval();
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0 rounded-xl"
            disabled={fieldsDisabled || maxAmount <= 0}
            onClick={() => {
              setAmount(String(maxAmount));
              resetApproval();
            }}
          >
            {t("fillMaxShort")}
          </Button>
        </div>
        <FieldHint
          id="refund-amount-hint"
          className={amountError ? "text-destructive" : undefined}
        >
          {amountError ? t("amountError", { max: formatMoney(maxAmount) }) : fullLabel}
        </FieldHint>
      </FieldGroup>

      <CheckboxRow
        className={tipAvailable ? undefined : "cursor-not-allowed opacity-60"}
      >
        <input
          type="checkbox"
          className="cursor-pointer"
          checked={tipOn}
          disabled={fieldsDisabled || !tipAvailable}
          onChange={(event) => {
            setTipChoice(event.target.checked);
            resetApproval();
          }}
        />
        <span>
          {t("refundTip")}
          <span className="block text-xs text-muted-foreground">
            {tipAvailable
              ? t("refundTipHint", { tip: formatMoney(refundable.tip) })
              : t("refundTipNone")}
          </span>
        </span>
      </CheckboxRow>

      <FieldGroup>
        <FieldLabel htmlFor="refund-reason">{t("reasonLabel")}</FieldLabel>
        <SelectInput
          id="refund-reason"
          value={reasonCode}
          disabled={fieldsDisabled}
          onChange={(event) =>
            setReasonCode(event.target.value as RefundReasonCode | "")
          }
        >
          <option value="" disabled>
            {t("reasonPlaceholder")}
          </option>
          {REFUND_REASON_CODES.map((code) => (
            <option key={code} value={code}>
              {t(`reasons.${code}`)}
            </option>
          ))}
        </SelectInput>
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="refund-reason-text">{t("detailLabel")}</FieldLabel>
        <TextInput
          id="refund-reason-text"
          value={reasonText}
          maxLength={REFUND_REASON_MAX_LENGTH}
          disabled={fieldsDisabled}
          autoComplete="off"
          aria-invalid={reasonText !== "" && !reasonValid}
          aria-describedby="refund-reason-hint"
          onChange={(event) => setReasonText(event.target.value)}
        />
        <FieldHint
          id="refund-reason-hint"
          className={
            reasonText !== "" && !reasonValid ? "text-destructive" : undefined
          }
        >
          {t("detailHint", { min: REFUND_REASON_MIN_LENGTH })}
        </FieldHint>
      </FieldGroup>

      {approval ? (
        <fieldset className="space-y-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
          <legend className="px-1 text-sm font-semibold">
            {t("approvalTitle")}
          </legend>
          <p className="text-sm">
            {t("approvalDescription", {
              limit: formatMoney(approval.limit),
              dayRefunded: formatMoney(approval.dayRefunded),
              requiredTotal: formatMoney(approval.requiredTotal),
            })}
          </p>
          {approval.approvers.length === 0 ? (
            <p className="text-sm text-destructive">{t("approvalNoApprovers")}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldGroup>
                <FieldLabel htmlFor="refund-approver">
                  {t("approverLabel")}
                </FieldLabel>
                <SelectInput
                  id="refund-approver"
                  value={approverId}
                  disabled={mutation.isPending}
                  onChange={(event) => setApproverId(event.target.value)}
                >
                  <option value="" disabled>
                    {t("approverPlaceholder")}
                  </option>
                  {approval.approvers.map((approver) => (
                    <option key={approver.staffUserId} value={approver.staffUserId}>
                      {approver.name}
                    </option>
                  ))}
                </SelectInput>
              </FieldGroup>
              <FieldGroup>
                <FieldLabel htmlFor="refund-pin">{t("pinLabel")}</FieldLabel>
                <TextInput
                  id="refund-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={6}
                  value={pin}
                  disabled={mutation.isPending}
                  onChange={(event) =>
                    setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />
              </FieldGroup>
            </div>
          )}
        </fieldset>
      ) : null}

      {method === "CASH_MANUAL" && amountValue !== null && !amountError ? (
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Banknote className="size-4 shrink-0" aria-hidden="true" />
          {t("cashToHandOver", { amount: formatMoney(amountValue) })}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={mutation.isPending}
          onClick={onClose}
        >
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          className="rounded-full"
          disabled={!canSubmit || mutation.isPending}
        >
          {mutation.isPending ? <Spinner /> : null}
          {mutation.isPending
            ? t("confirming")
            : method === "MANUAL_EXTERNAL"
              ? t("confirmExternal")
              : t("confirm")}
        </Button>
      </DialogFooter>
    </form>
  );
}
