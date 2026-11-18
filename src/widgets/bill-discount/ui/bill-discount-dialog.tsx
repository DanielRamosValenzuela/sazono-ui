"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlert } from "lucide-react";
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
import { discountsApi } from "@/shared/api/discounts-api";
import { ApiError } from "@/shared/api/http-client";
import { formatMoney } from "@/shared/lib/format";
import {
  DISCOUNT_REASONS,
  DISCOUNT_REASON_MAX_LENGTH,
  DISCOUNT_REASON_MIN_LENGTH,
  DISCOUNT_TYPES,
  type CreateDiscountRequest,
  type DiscountApprover,
  type DiscountReason,
  type DiscountType,
} from "@/shared/types/discounts";
import {
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextArea,
  TextInput,
} from "@/shared/ui/form-controls";

const PIN_PATTERN = /^\d{4,6}$/;
const AMOUNT_PATTERN = /^[1-9]\d{0,9}$/;
const PERCENT_PATTERN = /^(0|[1-9]\d{0,2})(\.\d{1,2})?$/;
const PREVIEW_DEBOUNCE_MS = 400;
const WHOLE_BILL = "";

type BillDiscountDialogProps = {
  accessToken: string;
  branchId: string;
  billId: string;
  title?: string;
  onClose: () => void;
};

function newIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function errorDetails(error: unknown) {
  if (!(error instanceof ApiError)) {
    return { status: 0, code: null as string | null, payload: null };
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

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}

export function BillDiscountDialog({
  accessToken,
  branchId,
  billId,
  title,
  onClose,
}: BillDiscountDialogProps) {
  const t = useTranslations("Discounts");
  const queryClient = useQueryClient();
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [scope, setScope] = useState(WHOLE_BILL);
  const [type, setType] = useState<DiscountType>("PERCENT");
  const [value, setValue] = useState("");
  const [reasonCode, setReasonCode] = useState<DiscountReason | "">("");
  const [reasonText, setReasonText] = useState("");
  const [approverId, setApproverId] = useState("");
  const [pin, setPin] = useState("");
  const [forcedApprovers, setForcedApprovers] = useState<DiscountApprover[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");

  const listQuery = useQuery({
    queryKey: ["billing", "discounts", billId],
    staleTime: 0,
    retry: false,
    queryFn: () => discountsApi.list(accessToken, branchId, billId),
  });
  const list = listQuery.data;
  const activeDiscounts = (list?.discounts ?? []).filter((item) => !item.voidedAt);
  const voidedDiscounts = (list?.discounts ?? []).filter((item) => item.voidedAt);
  const lineAvailable = (list?.items ?? []).filter(
    (item) =>
      !activeDiscounts.some((discount) => discount.billItemId === item.billItemId)
  );
  const billDiscountActive = activeDiscounts.some(
    (discount) => discount.billItemId === null
  );
  const scopeIsBill = scope === WHOLE_BILL;

  const valueTrimmed = value.trim();
  const valueValid =
    type === "AMOUNT"
      ? AMOUNT_PATTERN.test(valueTrimmed)
      : PERCENT_PATTERN.test(valueTrimmed) &&
        Number(valueTrimmed) > 0 &&
        Number(valueTrimmed) <= 100;
  const reasonTrimmed = reasonText.trim();
  const reasonValid =
    reasonTrimmed.length >= DISCOUNT_REASON_MIN_LENGTH &&
    reasonTrimmed.length <= DISCOUNT_REASON_MAX_LENGTH;

  const draft = useDebounced(
    { scope, type, value: valueTrimmed, reasonCode },
    PREVIEW_DEBOUNCE_MS
  );
  const draftValid =
    draft.type === "AMOUNT"
      ? AMOUNT_PATTERN.test(draft.value)
      : PERCENT_PATTERN.test(draft.value) &&
        Number(draft.value) > 0 &&
        Number(draft.value) <= 100;
  const blockedScope = draft.scope === WHOLE_BILL ? billDiscountActive : false;

  const previewQuery = useQuery({
    queryKey: [
      "billing",
      "discount-preview",
      billId,
      draft.scope,
      draft.type,
      draft.value,
    ],
    enabled: draftValid && !blockedScope && !listQuery.isLoading,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    queryFn: () =>
      discountsApi.preview(accessToken, branchId, billId, {
        ...(draft.scope === WHOLE_BILL ? {} : { billItemId: draft.scope }),
        type: draft.type,
        value: draft.value,
        reasonCode: draft.reasonCode || "OTHER",
        reasonText: "preview",
      }),
  });
  const preview = draftValid && !blockedScope ? previewQuery.data : undefined;
  const previewError = previewQuery.error
    ? errorDetails(previewQuery.error)
    : null;
  const approvers = forcedApprovers ?? preview?.approvers ?? [];
  const needsApproval = forcedApprovers !== null || preview?.needsApproval === true;
  const approvalReady = !needsApproval || (approverId !== "" && PIN_PATTERN.test(pin));
  const canSubmit =
    valueValid &&
    reasonCode !== "" &&
    reasonValid &&
    approvalReady &&
    !blockedScope &&
    !previewError;

  const errorMessage = (code: string | null, status: number) => {
    if (code && t.has(`errors.${code}`)) {
      return t(`errors.${code}`);
    }

    if (status === 0) {
      return t("errors.network");
    }

    if (status === 403) {
      return t("errors.forbidden");
    }

    return t("errors.generic");
  };

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["billing"] }),
      queryClient.invalidateQueries({ queryKey: ["floor"] }),
      queryClient.invalidateQueries({ queryKey: ["reports"] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: () => {
      const body: CreateDiscountRequest = {
        ...(scopeIsBill ? {} : { billItemId: scope }),
        type,
        value: valueTrimmed,
        reasonCode: reasonCode as DiscountReason,
        reasonText: reasonTrimmed,
        ...(needsApproval ? { approverStaffUserId: approverId, approverPin: pin } : {}),
      };

      return discountsApi.create(accessToken, branchId, billId, idempotencyKey, body);
    },
    onSuccess: async (data) => {
      toast.success(t("success"));

      if (data.splitCancelled) {
        toast.info(t("splitCancelled"));
      }

      setIdempotencyKey(newIdempotencyKey());
      setValue("");
      setReasonText("");
      setReasonCode("");
      setScope(WHOLE_BILL);
      setPin("");
      setApproverId("");
      setForcedApprovers(null);
      setError(null);
      await refreshAll();
    },
    onError: (failure) => {
      const { status, code, payload } = errorDetails(failure);

      if (code === "DISCOUNT_NEEDS_APPROVAL" && payload) {
        const list = Array.isArray(payload.approvers)
          ? (payload.approvers as DiscountApprover[])
          : [];

        setForcedApprovers(list);
        setApproverId(list.length === 1 ? list[0].staffUserId : "");
        setPin("");
        setError(null);
        return;
      }

      if (
        code === "DISCOUNT_PIN_INVALID" ||
        code === "DISCOUNT_PIN_LOCKED" ||
        code === "DISCOUNT_APPROVER_INVALID" ||
        code === "DISCOUNT_APPROVAL_BLOCKED"
      ) {
        setPin("");
      }

      if (code === "DISCOUNT_EXCEEDS_REMAINING" && payload) {
        setError(
          t("errors.DISCOUNT_EXCEEDS_REMAINING_MAX", {
            amount: formatMoney(String(payload.maxDiscount ?? "0")),
          })
        );
        return;
      }

      setError(errorMessage(code, status));
    },
  });

  const voidMutation = useMutation({
    mutationFn: (discountId: string) =>
      discountsApi.void(accessToken, branchId, billId, discountId, voidReason.trim()),
    onSuccess: async () => {
      toast.success(t("voidSuccess"));
      setVoidingId(null);
      setVoidReason("");
      setError(null);
      await refreshAll();
    },
    onError: (failure) => {
      const { status, code } = errorDetails(failure);

      setError(errorMessage(code, status));
    },
  });

  const submit = () => {
    if (!canSubmit || createMutation.isPending) {
      return;
    }

    setError(null);
    createMutation.mutate();
  };

  const bill = list?.bill;
  const reasonLabel = (code: string) =>
    t.has(`reasons.${code}`) ? t(`reasons.${code}`) : code;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title ?? t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {listQuery.isLoading ? (
          <Skeleton className="h-28 w-full rounded-2xl" />
        ) : null}

        {listQuery.error ? (
          <p role="alert" className="text-sm text-destructive">
            {t("errors.load")}
          </p>
        ) : null}

        {bill ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-2xl border border-border/70 bg-background/50 p-4 text-sm">
            <SummaryRow label={t("subtotal")} value={formatMoney(bill.subtotalAmount)} />
            <SummaryRow
              label={t("discount")}
              value={`- ${formatMoney(bill.discountAmount)}`}
            />
            <SummaryRow label={t("consumption")} value={formatMoney(bill.consumptionAmount)} />
            <SummaryRow label={t("tip")} value={formatMoney(bill.tipAmount)} />
            <SummaryRow label={t("total")} value={formatMoney(bill.totalAmount)} strong />
            <SummaryRow label={t("paid")} value={formatMoney(bill.paidAmount)} />
            <SummaryRow
              label={t("remaining")}
              value={formatMoney(bill.remainingAmount)}
              strong
            />
          </dl>
        ) : null}

        <section className="space-y-2" aria-label={t("activeTitle")}>
          <h3 className="text-sm font-semibold">{t("activeTitle")}</h3>
          {activeDiscounts.length === 0 && !listQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("none")}</p>
          ) : null}
          {activeDiscounts.map((discount) => (
            <div
              key={discount.id}
              className="space-y-2 rounded-xl border border-border/70 p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="font-medium">
                    {discount.billItemDescription
                      ? t("lineScope", { name: discount.billItemDescription })
                      : t("wholeBill")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {discount.type === "PERCENT"
                      ? `${Number(discount.value)} %`
                      : formatMoney(discount.value)}
                    {" · "}
                    {reasonLabel(discount.reasonCode)}
                  </p>
                  <p className="text-xs text-muted-foreground break-words">
                    {discount.reasonText}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("appliedBy", { name: discount.appliedByName })}
                    {discount.approvedByName
                      ? ` · ${t("approvedBy", { name: discount.approvedByName })}`
                      : ""}
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">
                  - {formatMoney(discount.amount)}
                </p>
              </div>

              {voidingId === discount.id ? (
                <div className="space-y-2">
                  <FieldGroup>
                    <FieldLabel htmlFor={`void-reason-${discount.id}`}>
                      {t("voidReasonLabel")}
                    </FieldLabel>
                    <TextInput
                      id={`void-reason-${discount.id}`}
                      value={voidReason}
                      maxLength={DISCOUNT_REASON_MAX_LENGTH}
                      disabled={voidMutation.isPending}
                      onChange={(event) => setVoidReason(event.target.value)}
                    />
                  </FieldGroup>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-10 rounded-full"
                      disabled={voidMutation.isPending}
                      onClick={() => {
                        setVoidingId(null);
                        setVoidReason("");
                      }}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="min-h-10 rounded-full"
                      disabled={
                        voidReason.trim().length < DISCOUNT_REASON_MIN_LENGTH ||
                        voidMutation.isPending
                      }
                      onClick={() => voidMutation.mutate(discount.id)}
                    >
                      {voidMutation.isPending ? <Spinner /> : null}
                      {t("voidConfirm")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-10 rounded-full"
                  onClick={() => {
                    setVoidingId(discount.id);
                    setVoidReason("");
                  }}
                >
                  {t("voidAction")}
                </Button>
              )}
            </div>
          ))}
          {voidedDiscounts.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("voidedCount", { count: voidedDiscounts.length })}
            </p>
          ) : null}
        </section>

        {bill && bill.status !== "PAID" ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <h3 className="text-sm font-semibold">{t("newTitle")}</h3>

            <FieldGroup>
              <FieldLabel htmlFor="discount-scope">{t("scopeLabel")}</FieldLabel>
              <SelectInput
                id="discount-scope"
                value={scope}
                disabled={createMutation.isPending}
                onChange={(event) => setScope(event.target.value)}
              >
                <option value={WHOLE_BILL} disabled={billDiscountActive}>
                  {t("wholeBill")}
                </option>
                {lineAvailable.map((item) => (
                  <option key={item.billItemId} value={item.billItemId}>
                    {t("lineOption", {
                      name: item.description,
                      quantity: item.quantity,
                      amount: formatMoney(item.totalPrice),
                    })}
                  </option>
                ))}
              </SelectInput>
              {blockedScope ? (
                <FieldHint className="text-destructive">{t("billAlreadyActive")}</FieldHint>
              ) : null}
            </FieldGroup>

            <div
              role="group"
              aria-label={t("typeLabel")}
              className="grid grid-cols-2 gap-1 rounded-full border border-border/70 bg-card/80 p-1"
            >
              {DISCOUNT_TYPES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={type === option}
                  disabled={createMutation.isPending}
                  onClick={() => {
                    setType(option);
                    setValue("");
                  }}
                  className={
                    type === option
                      ? "min-h-11 cursor-pointer rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
                      : "min-h-11 cursor-pointer rounded-full px-4 text-sm font-semibold text-muted-foreground"
                  }
                >
                  {option === "PERCENT" ? t("typePercent") : t("typeAmount")}
                </button>
              ))}
            </div>

            <FieldGroup>
              <FieldLabel htmlFor="discount-value">{t("valueLabel")}</FieldLabel>
              <TextInput
                id="discount-value"
                inputMode={type === "AMOUNT" ? "numeric" : "decimal"}
                autoComplete="off"
                value={value}
                disabled={createMutation.isPending}
                aria-invalid={value !== "" && !valueValid}
                onChange={(event) => setValue(event.target.value)}
              />
              {value !== "" && !valueValid ? (
                <FieldHint className="text-destructive">
                  {type === "AMOUNT" ? t("valueAmountInvalid") : t("valuePercentInvalid")}
                </FieldHint>
              ) : null}
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="discount-reason">{t("reasonLabel")}</FieldLabel>
              <SelectInput
                id="discount-reason"
                value={reasonCode}
                disabled={createMutation.isPending}
                onChange={(event) => setReasonCode(event.target.value as DiscountReason)}
              >
                <option value="" disabled>
                  {t("reasonPlaceholder")}
                </option>
                {DISCOUNT_REASONS.map((code) => (
                  <option key={code} value={code}>
                    {reasonLabel(code)}
                  </option>
                ))}
              </SelectInput>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="discount-reason-text">
                {t("reasonDetailLabel")}
              </FieldLabel>
              <TextArea
                id="discount-reason-text"
                rows={2}
                maxLength={DISCOUNT_REASON_MAX_LENGTH}
                value={reasonText}
                disabled={createMutation.isPending}
                onChange={(event) => setReasonText(event.target.value)}
              />
              <FieldHint>{t("reasonDetailHint", { min: DISCOUNT_REASON_MIN_LENGTH })}</FieldHint>
            </FieldGroup>

            {previewQuery.isFetching && draftValid ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner /> {t("previewLoading")}
              </p>
            ) : null}

            {preview ? (
              <div className="space-y-1 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                <p className="font-semibold tabular-nums">
                  {t("previewDiscount", { amount: formatMoney(preview.newDiscountAmount) })}
                </p>
                <p className="tabular-nums">
                  {t("previewTotal", { amount: formatMoney(preview.bill.totalAmount) })}
                </p>
                <p className="tabular-nums">
                  {t("previewRemaining", {
                    amount: formatMoney(preview.bill.remainingAmount),
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("maxHint", { amount: formatMoney(preview.maxDiscount) })}
                </p>
              </div>
            ) : null}

            {previewError ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm text-destructive"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {errorMessage(previewError.code, previewError.status)}
              </p>
            ) : null}

            {needsApproval ? (
              <fieldset className="space-y-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
                <legend className="px-1 text-sm font-semibold">{t("approvalTitle")}</legend>
                <p className="text-sm">{t("approvalDescription")}</p>
                {approvers.length === 0 ? (
                  <p className="text-sm text-destructive">{t("approvalNoApprovers")}</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldGroup>
                      <FieldLabel htmlFor="discount-approver">{t("approverLabel")}</FieldLabel>
                      <SelectInput
                        id="discount-approver"
                        value={approverId}
                        disabled={createMutation.isPending}
                        onChange={(event) => setApproverId(event.target.value)}
                      >
                        <option value="" disabled>
                          {t("approverPlaceholder")}
                        </option>
                        {approvers.map((approver) => (
                          <option key={approver.staffUserId} value={approver.staffUserId}>
                            {approver.name}
                          </option>
                        ))}
                      </SelectInput>
                    </FieldGroup>
                    <FieldGroup>
                      <FieldLabel htmlFor="discount-pin">{t("pinLabel")}</FieldLabel>
                      <TextInput
                        id="discount-pin"
                        type="password"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={6}
                        value={pin}
                        disabled={createMutation.isPending}
                        onChange={(event) =>
                          setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                      />
                    </FieldGroup>
                  </div>
                )}
              </fieldset>
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
                className="min-h-11 rounded-full"
                disabled={createMutation.isPending}
                onClick={onClose}
              >
                {t("close")}
              </Button>
              <Button
                type="submit"
                className="min-h-11 rounded-full"
                disabled={!canSubmit || createMutation.isPending}
              >
                {createMutation.isPending ? <Spinner /> : null}
                {createMutation.isPending ? t("submitting") : t("submit")}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-full"
              onClick={onClose}
            >
              {t("close")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "text-right font-semibold tabular-nums" : "text-right tabular-nums"}>
        {value}
      </dd>
    </>
  );
}
