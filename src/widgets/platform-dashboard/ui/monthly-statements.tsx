"use client";

import { Fragment, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Download, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";
import { platformBillingApi } from "@/shared/api/platform-billing-api";
import { formatMoney } from "@/shared/lib/format";
import type {
  StatementGroup,
  StatementRow,
  StatementStatus,
  StatementStatusUpdate,
} from "@/shared/types/platform-billing";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { downloadBlob } from "@/widgets/reports/ui/download-blob";

const STATUS_KEY: Record<StatementStatus, string> = {
  DRAFT: "statusDraft",
  ISSUED: "statusIssued",
  PAID: "statusPaid",
  WAIVED: "statusWaived",
  VOID: "statusVoid",
};

const STATUS_CLASS: Record<StatementStatus, string> = {
  DRAFT: "text-muted-foreground",
  ISSUED: "border-transparent bg-secondary text-secondary-foreground",
  PAID: "border-transparent bg-accent text-accent-foreground",
  WAIVED: "text-muted-foreground",
  VOID: "text-destructive",
};

function defaultPeriod() {
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`;
}

type Translate = ReturnType<typeof useTranslations<"AdminBilling">>;

function StatusBadge({ status, t }: { status: StatementStatus; t: Translate }) {
  return (
    <Badge variant="outline" className={STATUS_CLASS[status]}>
      {t(STATUS_KEY[status] as "statusDraft")}
    </Badge>
  );
}

export function MonthlyStatements() {
  const t = useTranslations("AdminBilling");
  const session = useAdminSession();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState(defaultPeriod);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const enabled = session.isClientReady && Boolean(session.accessToken);

  const listQuery = useQuery({
    queryKey: ["admin", "statements", period, session.accessToken],
    enabled: enabled && /^\d{4}-\d{2}$/.test(period),
    retry: false,
    queryFn: () => platformBillingApi.list(session.accessToken!, period),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "statements"] });

  const finalizeMutation = useMutation({
    mutationFn: () => platformBillingApi.finalize(session.accessToken!, period),
    onSuccess: async (result) => {
      setConfirmOpen(false);
      await refresh();
      toast.success(t("finalizeSuccess", { count: result.finalized }));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("finalizeError"));
    },
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      platformBillingApi.downloadCsv(session.accessToken!, period),
    onSuccess: (blob) => downloadBlob(blob, `estado-de-cuenta-${period}.csv`),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("exportError"));
    },
  });

  const data = listQuery.data;
  const rows = data?.rows ?? [];
  const hasDraft = rows.some((row) => row.status === "DRAFT");
  const detailRow = rows.find((row) => row.restaurantId === detailId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("pageDescription")}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm font-medium">
          {t("periodLabel")}
          <input
            type="month"
            value={period}
            onChange={(event) => {
              setPeriod(event.target.value);
              setExpanded(null);
            }}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
          />
        </label>
        <Button
          variant="outline"
          className="rounded-full"
          disabled={exportMutation.isPending || rows.length === 0}
          onClick={() => exportMutation.mutate()}
        >
          {exportMutation.isPending ? <Spinner /> : <Download />}
          {t("exportCsv")}
        </Button>
        <Button
          className="rounded-full"
          disabled={!hasDraft}
          onClick={() => setConfirmOpen(true)}
        >
          <Lock />
          {t("finalize")}
        </Button>
      </div>

      {hasDraft ? (
        <p
          role="status"
          className="rounded-2xl border border-border/70 bg-secondary/40 px-4 py-3 text-sm"
        >
          {t("draftBanner")}
        </p>
      ) : null}

      {listQuery.isLoading ? (
        <Skeleton className="h-72 w-full rounded-3xl" />
      ) : listQuery.isError ? (
        <p className="rounded-3xl border border-border/70 bg-card px-6 py-14 text-center font-medium shadow-sm">
          {t("loadError")}
        </p>
      ) : rows.length === 0 || !data ? (
        <p className="rounded-2xl border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-3xl border border-border/70 bg-card shadow-sm md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
                  <th className="px-4 py-3">{t("columnRestaurant")}</th>
                  <th className="px-4 py-3">{t("columnBranches")}</th>
                  <th className="px-4 py-3 text-right">{t("columnGross")}</th>
                  <th className="px-4 py-3 text-right">{t("columnRefunds")}</th>
                  <th className="px-4 py-3 text-right">{t("columnNet")}</th>
                  <th className="px-4 py-3 text-right">{t("columnFee")}</th>
                  <th className="px-4 py-3">{t("columnStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <Fragment key={row.restaurantId}>
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          className="cursor-pointer text-left font-medium hover:underline"
                          onClick={() => setDetailId(row.restaurantId)}
                        >
                          {row.restaurantName}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          aria-expanded={expanded === row.restaurantId}
                          className="inline-flex cursor-pointer items-center gap-1 text-muted-foreground"
                          onClick={() =>
                            setExpanded(
                              expanded === row.restaurantId
                                ? null
                                : row.restaurantId
                            )
                          }
                        >
                          {expanded === row.restaurantId ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                          {row.branches.length}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {formatMoney(row.grossSales)}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {formatMoney(row.refunds)}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {formatMoney(row.netSales)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums">
                        {formatMoney(row.feeAmount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={row.status} t={t} />
                      </td>
                    </tr>
                    {expanded === row.restaurantId
                      ? row.branches.map((branch) => (
                          <tr
                            key={branch.branchId}
                            className="border-b border-border/50 bg-muted/30 text-muted-foreground"
                          >
                            <td className="px-4 py-2" />
                            <td className="px-4 py-2">{branch.name}</td>
                            <td className="px-4 py-2" />
                            <td className="px-4 py-2" />
                            <td className="px-4 py-2 text-right tabular-nums">
                              {formatMoney(branch.netSales)}
                            </td>
                            <td className="px-4 py-2" />
                            <td className="px-4 py-2" />
                          </tr>
                        ))
                      : null}
                  </Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="px-4 py-3" colSpan={2}>
                    {t("totals")}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(data.totals.grossSales)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(data.totals.refunds)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(data.totals.netSales)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(data.totals.feeAmount)}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>

          <ul className="grid gap-3 md:hidden">
            {rows.map((row) => (
              <li
                key={row.restaurantId}
                className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
              >
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-start justify-between gap-2 text-left"
                  onClick={() => setDetailId(row.restaurantId)}
                >
                  <span className="font-medium break-words">
                    {row.restaurantName}
                  </span>
                  <StatusBadge status={row.status} t={t} />
                </button>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">{t("columnGross")}</dt>
                  <dd className="text-right tabular-nums">
                    {formatMoney(row.grossSales)}
                  </dd>
                  <dt className="text-muted-foreground">
                    {t("columnRefunds")}
                  </dt>
                  <dd className="text-right tabular-nums">
                    {formatMoney(row.refunds)}
                  </dd>
                  <dt className="text-muted-foreground">{t("columnNet")}</dt>
                  <dd className="text-right tabular-nums">
                    {formatMoney(row.netSales)}
                  </dd>
                  <dt className="font-medium">{t("columnFee")}</dt>
                  <dd className="text-right font-medium tabular-nums">
                    {formatMoney(row.feeAmount)}
                  </dd>
                </dl>
                {row.branches.length > 0 ? (
                  <p className="mt-2 text-xs break-words text-muted-foreground">
                    {row.branches.map((branch) => branch.name).join(", ")}
                  </p>
                ) : null}
              </li>
            ))}
            <li className="flex justify-between rounded-2xl border border-border/70 bg-card p-4 text-sm font-semibold">
              <span>{t("totals")}</span>
              <span className="tabular-nums">
                {formatMoney(data.totals.feeAmount)}
              </span>
            </li>
          </ul>
        </>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("finalizeTitle", { period })}</DialogTitle>
            <DialogDescription>{t("finalizeDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              disabled={finalizeMutation.isPending}
              onClick={() => finalizeMutation.mutate()}
            >
              {finalizeMutation.isPending ? <Spinner /> : null}
              {t("finalizeConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailRow !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailId(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          {detailRow ? (
            <StatementDetailView
              row={detailRow}
              period={period}
              token={session.accessToken!}
              onChanged={refresh}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

type DetailProps = {
  row: StatementRow;
  period: string;
  token: string;
  onChanged: () => Promise<void>;
};

function StatementDetailView({ row, period, token, onChanged }: DetailProps) {
  const t = useTranslations("AdminBilling");
  const tc = useTranslations("ConfirmActions.money");
  const [pending, setPending] = useState<"PAID" | "WAIVED" | "VOID" | null>(
    null,
  );

  const detailQuery = useQuery({
    queryKey: ["admin", "statement-detail", row.restaurantId, period, row.status],
    retry: false,
    queryFn: () => platformBillingApi.detail(token, row.restaurantId, period),
  });

  const statusMutation = useMutation({
    mutationFn: (payload: StatementStatusUpdate) =>
      platformBillingApi.updateStatus(token, row.restaurantId, period, payload),
    onSuccess: async () => {
      await onChanged();
      toast.success(t("statusUpdateSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("statusUpdateError"));
    },
  });

  const runStatus = async (reason?: string) => {
    if (!pending) {
      return;
    }

    try {
      await statusMutation.mutateAsync({
        status: pending,
        notes: reason,
      });
      setPending(null);
    } catch {
      return;
    }
  };

  const confirmKey =
    pending === "WAIVED"
      ? "platform-waive"
      : pending === "VOID"
        ? "platform-void"
        : "platform-mark-paid";
  const detail = detailQuery.data;
  const actionable = row.status === "ISSUED";
  const canVoid =
    row.status === "ISSUED" || row.status === "PAID" || row.status === "WAIVED";

  return (
    <div className="grid min-w-0 gap-4">
      <DialogHeader>
        <DialogTitle>{row.restaurantName}</DialogTitle>
        <DialogDescription>
          {period} · {t("feeRate", { rate: row.feeBps / 100 })}
        </DialogDescription>
      </DialogHeader>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        {(
          [
            ["columnGross", row.grossSales],
            ["tips", row.tipsTotal],
            ["columnRefunds", row.refunds],
            ["discounts", row.discounts],
            ["carryOver", row.carryOver],
            ["columnNet", row.netSales],
            ["columnFee", row.feeAmount],
          ] as const
        ).map(([key, value]) => (
          <Fragment key={key}>
            <dt className="text-muted-foreground">{t(key)}</dt>
            <dd className="text-right tabular-nums">{formatMoney(value)}</dd>
          </Fragment>
        ))}
      </dl>

      {detailQuery.isLoading ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : detail ? (
        <>
          <BreakdownTable
            title={t("byBranch")}
            rows={detail.branches.map((b) => ({ ...b, key: b.branchId }))}
            t={t}
          />
          <BreakdownTable
            title={t("byMethod")}
            rows={detail.methods}
            t={t}
          />
          <BreakdownTable title={t("byDay")} rows={detail.days} t={t} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t("loadError")}</p>
      )}

      {row.notes ? (
        <p className="text-sm text-muted-foreground">{row.notes}</p>
      ) : null}

      {actionable || canVoid ? (
        <div className="flex flex-wrap gap-2 border-t border-border/70 pt-4">
          {actionable ? (
            <Button
              className="max-sm:h-11"
              disabled={statusMutation.isPending}
              onClick={() => setPending("PAID")}
            >
              {t("markPaid")}
            </Button>
          ) : null}
          {actionable ? (
            <Button
              variant="outline"
              className="max-sm:h-11"
              disabled={statusMutation.isPending}
              onClick={() => setPending("WAIVED")}
            >
              {t("waive")}
            </Button>
          ) : null}
          {canVoid ? (
            <Button
              variant="outline"
              className="max-sm:h-11"
              disabled={statusMutation.isPending}
              onClick={() => setPending("VOID")}
            >
              {t("void")}
            </Button>
          ) : null}
        </div>
      ) : null}
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null);
          }
        }}
        tone={
          pending === "VOID"
            ? "destructive"
            : pending === "WAIVED"
              ? "warning"
              : "primary"
        }
        requireReason={pending === "WAIVED" || pending === "VOID"}
        optionalReason={pending === "PAID"}
        isPending={statusMutation.isPending}
        title={tc(`${confirmKey}.title`)}
        description={tc(`${confirmKey}.description`)}
        confirmLabel={tc(`${confirmKey}.confirm`)}
        impact={tc(`${confirmKey}.impact`, {
          name: row.restaurantName,
          period,
          amount: formatMoney(row.feeAmount),
          status: t(STATUS_KEY[row.status] as "statusDraft"),
        })}
        onConfirm={runStatus}
      />
    </div>
  );
}

function BreakdownTable({
  title,
  rows,
  t,
}: {
  title: string;
  rows: StatementGroup[];
  t: Translate;
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="min-w-0">
      <h3 className="mb-1 text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="max-h-48 overflow-auto rounded-xl border border-border/70">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="px-3 py-2" />
              <th className="px-3 py-2 text-right">{t("columnGross")}</th>
              <th className="px-3 py-2 text-right">{t("columnRefunds")}</th>
              <th className="px-3 py-2 text-right">{t("columnNet")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr key={entry.key} className="border-t border-border/50">
                <td className="px-3 py-1.5">{entry.key}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {formatMoney(entry.grossSales)}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {formatMoney(entry.refunds)}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {formatMoney(entry.netSales)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
