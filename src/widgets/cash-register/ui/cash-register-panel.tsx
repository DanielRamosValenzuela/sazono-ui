"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, Lock, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";
import { cashApi } from "@/shared/api/cash-api";
import {
  getBranchAccessList,
  hasBranchPermission,
} from "@/shared/lib/branch-access";
import { formatMoney } from "@/shared/lib/format";
import type { BranchRole } from "@/shared/types/auth";
import type { CashSession } from "@/shared/types/cash";
import {
  FieldGroup,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import { digitsOnly, errorMessage, formatDateTime } from "./cash-helpers";
import { CloseSheet, MovementSheet, Row } from "./cash-sheets";

const CASH_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR", "CASHIER"];
const OPEN_ROLES: BranchRole[] = ["ADMIN", "CASHIER"];
const MANAGER_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR"];
const REFETCH_MS = 15_000;

export function CashRegisterPanel() {
  const t = useTranslations("CashRegister");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const session = useAdminSession();
  const token = session.accessToken;
  const branches = useMemo(
    () =>
      (session.user ? getBranchAccessList(session.user) : []).filter((branch) =>
        hasBranchPermission(branch, CASH_ROLES),
      ),
    [session.user],
  );
  const [rawBranchId, setBranchId] = useState("");
  const branchId = branches.some((branch) => branch.branchId === rawBranchId)
    ? rawBranchId
    : (branches[0]?.branchId ?? "");
  const branch = branches.find((item) => item.branchId === branchId) ?? null;
  const canOpen = hasBranchPermission(branch, OPEN_ROLES);
  const isManager = hasBranchPermission(branch, MANAGER_ROLES);
  const enabled = session.isClientReady && Boolean(token) && Boolean(branchId);

  const [label, setLabel] = useState("Caja 1");
  const [openingFloat, setOpeningFloat] = useState("");
  const [movementOpen, setMovementOpen] = useState(false);
  const [closeTarget, setCloseTarget] = useState<{
    session: CashSession;
    forced: boolean;
  } | null>(null);

  const currentQuery = useQuery({
    queryKey: ["cash", "current", branchId],
    enabled,
    refetchInterval: REFETCH_MS,
    queryFn: () => cashApi.current(token!, branchId),
  });
  const historyQuery = useQuery({
    queryKey: ["cash", "sessions", branchId],
    enabled,
    queryFn: () => cashApi.listSessions(token!, branchId),
  });
  const current = currentQuery.data?.session ?? null;
  const movementsQuery = useQuery({
    queryKey: ["cash", "movements", branchId, current?.id],
    enabled: enabled && Boolean(current),
    queryFn: () => cashApi.listMovements(token!, branchId, current!.id),
  });

  const openMutation = useMutation({
    mutationFn: () =>
      cashApi.open(token!, branchId, {
        registerLabel: label.trim() || undefined,
        openingFloat,
      }),
    onSuccess: async () => {
      toast.success(t("openedToast"));
      setOpeningFloat("");
      await queryClient.invalidateQueries({ queryKey: ["cash"] });
    },
    onError: (error) => toast.error(errorMessage(error, t("genericError"))),
  });

  if (!session.isClientReady) {
    return <Skeleton className="h-64 w-full rounded-3xl" />;
  }

  if (branches.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noAccess")}</p>;
  }

  const history = (historyQuery.data?.sessions ?? []).filter(
    (item) => item.id !== current?.id,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </header>

      {branches.length > 1 ? (
        <FieldGroup>
          <FieldLabel htmlFor="cash-branch">{t("branch")}</FieldLabel>
          <SelectInput
            id="cash-branch"
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
          >
            {branches.map((item) => (
              <option key={item.branchId} value={item.branchId}>
                {item.branchName}
              </option>
            ))}
          </SelectInput>
        </FieldGroup>
      ) : null}

      {currentQuery.isLoading ? (
        <Skeleton className="h-56 w-full rounded-3xl" />
      ) : current ? (
        <section className="space-y-4 rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {current.registerLabel} ·{" "}
                {t("since", { time: formatDateTime(current.openedAt, locale) })}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                {t("expectedSoFar")}
              </p>
              <p className="font-heading text-4xl font-bold">
                {formatMoney(current.expectedCash)}
              </p>
            </div>
            <Badge>{t("statusOpen")}</Badge>
          </div>
          <dl className="space-y-2 text-sm">
            <Row
              label={t("openingFloat")}
              value={formatMoney(current.openingFloat)}
            />
            <Row
              label={t("cashSales")}
              value={formatMoney(current.cashSalesAmount)}
            />
            <Row
              label={t("cashIn")}
              value={formatMoney(current.cashInAmount)}
            />
            <Row
              label={t("cashOut")}
              value={formatMoney(current.cashOutAmount)}
            />
            <Row
              label={t("refundOut")}
              value={formatMoney(current.refundOutAmount)}
            />
            {Number(current.otherMovementsAmount) !== 0 ? (
              <Row
                label={t("other")}
                value={formatMoney(current.otherMovementsAmount)}
              />
            ) : null}
          </dl>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              size="lg"
              variant="outline"
              onClick={() => setMovementOpen(true)}
            >
              <ArrowUpFromLine />
              {t("registerMovement")}
            </Button>
            <Button
              size="lg"
              onClick={() =>
                setCloseTarget({ session: current, forced: false })
              }
            >
              <Lock />
              {t("closeRegister")}
            </Button>
          </div>
          {movementsQuery.data && movementsQuery.data.movements.length > 0 ? (
            <ul className="divide-y divide-border/60 text-sm">
              {movementsQuery.data.movements.map((movement) => (
                <li
                  key={movement.id}
                  className="flex justify-between gap-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{movement.reason}</span>
                    <span className="text-xs text-muted-foreground">
                      {t(`movementKind.${movement.type}`)} ·{" "}
                      {formatDateTime(movement.createdAt, locale)}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatMoney(movement.amount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : canOpen ? (
        <section className="space-y-4 rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">{t("openTitle")}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{t("openHint")}</p>
          <FieldGroup>
            <FieldLabel htmlFor="cash-label">{t("registerLabel")}</FieldLabel>
            <TextInput
              id="cash-label"
              value={label}
              maxLength={40}
              onChange={(event) => setLabel(event.target.value)}
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="cash-float">{t("openingFloat")}</FieldLabel>
            <TextInput
              id="cash-float"
              inputMode="numeric"
              value={openingFloat}
              placeholder="20000"
              onChange={(event) =>
                setOpeningFloat(digitsOnly(event.target.value))
              }
            />
          </FieldGroup>
          <Button
            size="lg"
            className="w-full"
            disabled={openingFloat === "" || openMutation.isPending}
            onClick={() => openMutation.mutate()}
          >
            {openMutation.isPending ? <Spinner /> : <ArrowDownToLine />}
            {t("openAction")}
          </Button>
        </section>
      ) : (
        <p className="rounded-2xl border border-border/70 bg-card p-4 text-sm text-muted-foreground">
          {t("noOwnSession")}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {isManager ? t("historyAll") : t("historyMine")}
        </h2>
        {historyQuery.isLoading ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("historyEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {history.map((item) => {
              const difference = Number(item.difference ?? 0);

              return (
                <li
                  key={item.id}
                  className="space-y-2 rounded-2xl border border-border/70 bg-card p-4 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {item.registerLabel}
                        {item.cashierName ? ` · ${item.cashierName}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(item.openedAt, locale)}
                        {item.closedAt
                          ? ` → ${formatDateTime(item.closedAt, locale)}`
                          : ""}
                      </p>
                    </div>
                    {item.status === "OPEN" ? (
                      <Badge>{t("statusOpen")}</Badge>
                    ) : item.forced ? (
                      <Badge variant="outline">{t("statusForced")}</Badge>
                    ) : null}
                  </div>
                  <dl className="space-y-1">
                    <Row
                      label={t("expected")}
                      value={formatMoney(item.expectedCash)}
                    />
                    {item.status === "CLOSED" ? (
                      <>
                        <Row
                          label={t("counted")}
                          value={formatMoney(item.countedCash ?? 0)}
                        />
                        <Row
                          label={t("difference")}
                          value={formatMoney(difference)}
                          tone={difference === 0 ? "ok" : "bad"}
                          strong
                        />
                      </>
                    ) : null}
                  </dl>
                  {item.closingNote ? (
                    <p className="text-xs text-muted-foreground">
                      {item.closingNote}
                    </p>
                  ) : null}
                  {item.status === "OPEN" && isManager ? (
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={() =>
                        setCloseTarget({ session: item, forced: true })
                      }
                    >
                      {t("forceCloseAction")}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {movementOpen && token ? (
        <MovementSheet
          token={token}
          branchId={branchId}
          onClose={() => setMovementOpen(false)}
        />
      ) : null}
      {closeTarget && token ? (
        <CloseSheet
          token={token}
          branchId={branchId}
          session={closeTarget.session}
          forced={closeTarget.forced}
          onClose={() => setCloseTarget(null)}
        />
      ) : null}
    </div>
  );
}
