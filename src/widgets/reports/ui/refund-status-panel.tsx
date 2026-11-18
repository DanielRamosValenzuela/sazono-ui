"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CircleAlert, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/shared/api/http-client";
import { refundsApi } from "@/shared/api/refunds-api";
import type { RefundRecord, RefundResult } from "@/shared/types/refunds";

const STALE_PENDING_MS = 2 * 60 * 1000;

type RefundStatusPanelProps = {
  token: string | null;
  refund: RefundRecord;
  canManage: boolean;
  onSettled: (result: RefundResult) => void;
};

function errorCode(error: unknown) {
  if (!(error instanceof ApiError)) {
    return null;
  }

  const details = error.details as { code?: unknown } | null;

  return typeof details?.code === "string" ? details.code : null;
}

export function RefundStatusPanel({
  token,
  refund,
  canManage,
  onSettled,
}: RefundStatusPanelProps) {
  const t = useTranslations("Refunds");
  const [mountedAt] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);

  const run = (action: "retry" | "markManual") => () =>
    refundsApi[action](token!, refund.refundId);
  const options = {
    onSuccess: (result: RefundResult) => {
      setError(null);
      onSettled(result);
    },
    onError: (failure: unknown) => {
      const code = errorCode(failure);

      setError(
        code && t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.generic")
      );
    },
  };
  const retry = useMutation({ mutationFn: run("retry"), ...options });
  const markManual = useMutation({ mutationFn: run("markManual"), ...options });
  const busy = retry.isPending || markManual.isPending;

  if (refund.method !== "GATEWAY") {
    return null;
  }

  const stalePending =
    refund.status === "PENDING" &&
    mountedAt - new Date(refund.createdAt).getTime() >= STALE_PENDING_MS;
  const actionable =
    canManage &&
    (refund.status === "FAILED" ||
      refund.status === "REQUIRES_MANUAL_REVIEW" ||
      stalePending);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={
            refund.status === "SUCCEEDED"
              ? "secondary"
              : refund.status === "PENDING"
                ? "outline"
                : "destructive"
          }
        >
          {refund.status === "PENDING" ? (
            <Clock aria-hidden="true" />
          ) : refund.status === "SUCCEEDED" ? null : (
            <CircleAlert aria-hidden="true" />
          )}
          {t(`status.${refund.status}`)}
        </Badge>
        {refund.failureReason ? (
          <span className="text-sm text-muted-foreground">
            {refund.failureReason}
          </span>
        ) : null}
      </div>
      {actionable ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={busy}
            onClick={() => retry.mutate()}
          >
            {retry.isPending ? <Spinner /> : null}
            {t("retry")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={busy}
            onClick={() => markManual.mutate()}
          >
            {markManual.isPending ? <Spinner /> : null}
            {t("markManual")}
          </Button>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
