"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Plus, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { floorApi } from "@/shared/api/floor-api";
import { ordersApi } from "@/shared/api/orders-api";
import { formatMoney } from "@/shared/lib/format";
import { hasBranchPermission, type BranchAccess } from "@/shared/lib/branch-access";
import type { CounterReadiness, CounterSessionListItem } from "@/shared/types/floor";
import { TextInput } from "@/shared/ui/form-controls";
import { AbandonSessionDialog } from "@/widgets/floor-console/ui/abandon-session-dialog";
import { AddOrderSheet } from "@/widgets/floor-console/ui/add-order-sheet";
import { CounterPayDialog } from "./counter-pay-dialog";
import {
  COUNTER_ABANDON_ROLES,
  COUNTER_CLOSE_ROLES,
  COUNTER_DELIVER_ROLES,
  COUNTER_PAY_ROLES,
  COUNTER_ROLES,
} from "./counter-roles";

const COUNTER_REFETCH_INTERVAL = 8_000;
const CUSTOMER_LABEL_MAX = 40;

export type ServiceView = "floor" | "counter";

type FloorCounterToggleProps = {
  value: ServiceView;
  onChange: (value: ServiceView) => void;
};

export function FloorCounterToggle({ value, onChange }: FloorCounterToggleProps) {
  const t = useTranslations("CounterBoard");
  const views: ServiceView[] = ["floor", "counter"];

  return (
    <div
      role="group"
      aria-label={t("tabsLabel")}
      className="grid grid-cols-2 gap-1 rounded-full border border-border/70 bg-card/80 p-1"
    >
      {views.map((view) => (
        <button
          key={view}
          type="button"
          aria-pressed={value === view}
          onClick={() => onChange(view)}
          className={cn(
            "min-h-11 cursor-pointer rounded-full px-4 text-sm font-semibold transition",
            value === view
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {view === "floor" ? t("viewFloor") : t("viewCounter")}
        </button>
      ))}
    </div>
  );
}

const READINESS_TONE: Record<CounterReadiness, string> = {
  EMPTY: "bg-muted text-muted-foreground",
  WAITING: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  PREPARING: "bg-primary/12 text-primary",
  PARTIALLY_READY: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  READY: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  DELIVERED: "bg-secondary text-secondary-foreground",
};

function sortSessions(items: CounterSessionListItem[]) {
  return [...items].sort((left, right) => {
    const leftReady = left.readiness === "READY" ? 0 : 1;
    const rightReady = right.readiness === "READY" ? 0 : 1;

    if (leftReady !== rightReady) {
      return leftReady - rightReady;
    }

    return new Date(left.openedAt).getTime() - new Date(right.openedAt).getTime();
  });
}

type CounterBoardProps = {
  accessToken: string;
  branchId: string;
  branchAccess: BranchAccess | null;
};

export function CounterBoard({ accessToken, branchId, branchAccess }: CounterBoardProps) {
  const t = useTranslations("CounterBoard");
  const queryClient = useQueryClient();
  const [mineOnly, setMineOnly] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [addOrderSessionId, setAddOrderSessionId] = useState<{ id: string; ticket: number } | null>(null);
  const [payTarget, setPayTarget] = useState<CounterSessionListItem | null>(null);
  const [abandonSessionId, setAbandonSessionId] = useState<string | null>(null);
  const previousReadyRef = useRef<{ key: string; ids: Set<string> } | null>(null);
  const announceToggleRef = useRef(false);

  const canUse = hasBranchPermission(branchAccess, COUNTER_ROLES);
  const canPay = hasBranchPermission(branchAccess, COUNTER_PAY_ROLES);
  const canClose = hasBranchPermission(branchAccess, COUNTER_CLOSE_ROLES);
  const canAbandon = hasBranchPermission(branchAccess, COUNTER_ABANDON_ROLES);
  const canDeliver = hasBranchPermission(branchAccess, COUNTER_DELIVER_ROLES);

  const sessionsQuery = useQuery({
    queryKey: ["floor", "counter-sessions", accessToken, branchId, mineOnly],
    enabled: canUse && Boolean(branchId),
    refetchInterval: COUNTER_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const items = await floorApi.listCounterSessions(accessToken, branchId, mineOnly);
      const readyNow = new Set(
        items.filter((item) => item.readiness === "READY").map((item) => item.tableSessionId)
      );
      const baselineKey = `${branchId}:${mineOnly}`;
      const previous =
        previousReadyRef.current?.key === baselineKey ? previousReadyRef.current.ids : null;

      if (previous) {
        const fresh = items
          .filter((item) => readyNow.has(item.tableSessionId) && !previous.has(item.tableSessionId))
          .map((item) => item.ticketNumber);

        if (fresh.length > 0) {
          announceToggleRef.current = !announceToggleRef.current;
          setAnnouncement(
            t("announceReady", { tickets: fresh.join(", ") }) +
              (announceToggleRef.current ? " " : "")
          );
        }
      }

      previousReadyRef.current = { key: baselineKey, ids: readyNow };
      return items;
    },
  });

  const refreshCounter = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["floor", "counter-sessions"] }),
      queryClient.invalidateQueries({ queryKey: ["orders", "branch-ready-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["billing", "open-bills"] }),
    ]);

  const openMutation = useMutation({
    mutationFn: () => floorApi.openCounterSession(accessToken, { branchId }),
    onSuccess: async (counterSession) => {
      setAddOrderSessionId({ id: counterSession.tableSessionId, ticket: counterSession.ticketNumber });
      await refreshCounter();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("newOrderError"));
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ sessionId, label }: { sessionId: string; label: string }) =>
      floorApi.renameCounterSession(accessToken, sessionId, { customerLabel: label }),
    onSuccess: () => refreshCounter(),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("renameError"));
    },
  });

  const deliverMutation = useMutation({
    mutationFn: ({ orderIds }: { sessionId: string; orderIds: string[] }) =>
      Promise.all(orderIds.map((orderId) => ordersApi.deliverOrder(accessToken, orderId))),
    onSuccess: () => {
      toast.success(t("deliverSuccess"));
    },
    onSettled: () =>
      Promise.all([
        refreshCounter(),
        queryClient.invalidateQueries({ queryKey: ["orders", "session"] }),
      ]),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("deliverError"));
    },
  });

  const closeMutation = useMutation({
    mutationFn: (sessionId: string) =>
      floorApi.closeTableSession(accessToken, sessionId, { closeReason: t("closeReason") }),
    onSuccess: async () => {
      await Promise.all([
        refreshCounter(),
        queryClient.invalidateQueries({ queryKey: ["billing", "current-bill"] }),
      ]);
      toast.success(t("closeSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("closeError"));
    },
  });

  const sessions = sortSessions(sessionsQuery.data ?? []);

  return (
    <section className="space-y-4" aria-labelledby="counter-board-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 id="counter-board-title" className="font-heading text-xl font-semibold">
            {t("title")}
          </h3>
          <p className="hidden text-sm text-muted-foreground md:block">{t("description")}</p>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={(event) => setMineOnly(event.target.checked)}
            className="size-4 cursor-pointer rounded border-border accent-primary"
          />
          {t("mineOnly")}
        </label>
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {sessionsQuery.isPending ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : null}

      {sessionsQuery.isError ? (
        <p className="text-sm text-destructive">
          {sessionsQuery.error instanceof Error ? sessionsQuery.error.message : t("loadError")}
        </p>
      ) : null}

      {!sessionsQuery.isPending && !sessionsQuery.isError && sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-background/45 p-5 text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {sessions.map((item) => (
          <CounterCard
            key={item.tableSessionId}
            item={item}
            canPay={canPay}
            canClose={canClose}
            canAbandon={canAbandon}
            canDeliver={canDeliver}
            isDelivering={
              deliverMutation.isPending && deliverMutation.variables?.sessionId === item.tableSessionId
            }
            isClosing={closeMutation.isPending && closeMutation.variables === item.tableSessionId}
            onRename={(label) =>
              renameMutation.mutate({ sessionId: item.tableSessionId, label })
            }
            onAddOrder={() => setAddOrderSessionId({ id: item.tableSessionId, ticket: item.ticketNumber })}
            onPay={() => setPayTarget(item)}
            onDeliver={() =>
              deliverMutation.mutate({
                sessionId: item.tableSessionId,
                orderIds: item.orders
                  .filter((order) => order.status === "READY")
                  .map((order) => order.orderId),
              })
            }
            onClose={() => closeMutation.mutate(item.tableSessionId)}
            onAbandon={() => setAbandonSessionId(item.tableSessionId)}
          />
        ))}
      </div>

      <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10">
        <Button
          type="button"
          size="lg"
          className="min-h-12 w-full rounded-full shadow-lg"
          disabled={openMutation.isPending}
          onClick={() => openMutation.mutate()}
        >
          {openMutation.isPending ? <Spinner /> : <Plus className="size-4" />}
          {t("newOrder")}
        </Button>
      </div>

      {addOrderSessionId ? (
        <AddOrderSheet
          accessToken={accessToken}
          branchId={branchId}
          tableSessionId={addOrderSessionId.id}
          counterTicketNumber={addOrderSessionId.ticket}
          onClose={() => setAddOrderSessionId(null)}
        />
      ) : null}

      {payTarget?.billId ? (
        <CounterPayDialog
          accessToken={accessToken}
          billId={payTarget.billId}
          ticketNumber={payTarget.ticketNumber}
          remainingAmount={payTarget.bill.remaining}
          onClose={() => setPayTarget(null)}
        />
      ) : null}

      {abandonSessionId ? (
        <AbandonSessionDialog
          accessToken={accessToken}
          tableSessionId={abandonSessionId}
          onClose={() => setAbandonSessionId(null)}
        />
      ) : null}
    </section>
  );
}

type CounterCardProps = {
  item: CounterSessionListItem;
  canPay: boolean;
  canClose: boolean;
  canAbandon: boolean;
  canDeliver: boolean;
  isDelivering: boolean;
  isClosing: boolean;
  onRename: (label: string) => void;
  onAddOrder: () => void;
  onPay: () => void;
  onDeliver: () => void;
  onClose: () => void;
  onAbandon: () => void;
};

function CounterCard({
  item,
  canPay,
  canClose,
  canAbandon,
  canDeliver,
  isDelivering,
  isClosing,
  onRename,
  onAddOrder,
  onPay,
  onDeliver,
  onClose,
  onAbandon,
}: CounterCardProps) {
  const t = useTranslations("CounterBoard");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const remaining = Number(item.bill.remaining);
  const hasReadyOrders = item.orders.some((order) => order.status === "READY");
  const isSettled = remaining <= 0;
  const isServed = item.readiness === "DELIVERED" || item.readiness === "EMPTY";
  const canCloseNow = isSettled && isServed;

  const commitName = () => {
    setEditing(false);
    const next = draft.trim();

    if (next !== (item.customerLabel ?? "")) {
      onRename(next);
    }
  };

  return (
    <Card
      className={cn(
        "rounded-2xl border bg-card/85",
        item.readiness === "READY"
          ? "border-emerald-500/50 shadow-md shadow-emerald-500/10"
          : "border-border/70"
      )}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-3xl leading-none font-bold tabular-nums">#{item.ticketNumber}</p>
            {editing ? (
              <TextInput
                autoFocus
                maxLength={CUSTOMER_LABEL_MAX}
                value={draft}
                placeholder={t("namePlaceholder")}
                aria-label={t("nameLabel", { ticket: item.ticketNumber })}
                className="mt-2 h-11"
                onChange={(event) => setDraft(event.target.value)}
                onBlur={commitName}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  } else if (event.key === "Escape") {
                    setDraft(item.customerLabel ?? "");
                    setEditing(false);
                  }
                }}
              />
            ) : (
              <button
                type="button"
                className="mt-1 min-h-11 max-w-full cursor-pointer truncate text-left text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
                aria-label={t("nameLabel", { ticket: item.ticketNumber })}
                onClick={() => {
                  setDraft(item.customerLabel ?? "");
                  setEditing(true);
                }}
              >
                {item.customerLabel ?? t("addName")}
              </button>
            )}
          </div>
          <Badge className={cn("shrink-0 border-0", READINESS_TONE[item.readiness])}>
            {t(`readiness_${item.readiness}`)}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">{isSettled ? t("paid") : t("remaining")}</span>
          <span className="font-semibold tabular-nums">
            {formatMoney(isSettled ? item.bill.total : item.bill.remaining, "CLP")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 rounded-full"
            onClick={onAddOrder}
          >
            <Plus className="size-4" />
            {t("addOrder")}
          </Button>
          {canPay && item.billId && !isSettled ? (
            <Button type="button" className="min-h-11 rounded-full" onClick={onPay}>
              <Wallet className="size-4" />
              {t("charge")}
            </Button>
          ) : null}
          {canDeliver && hasReadyOrders ? (
            <Button
              type="button"
              variant="outline"
              className="col-span-2 min-h-11 rounded-full"
              disabled={isDelivering}
              onClick={onDeliver}
            >
              {isDelivering ? <Spinner /> : <CheckCheck className="size-4" />}
              {t("deliver")}
            </Button>
          ) : null}
          {canClose ? (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 rounded-full"
              disabled={!canCloseNow || isClosing}
              title={canCloseNow ? undefined : t("closeBlocked")}
              onClick={onClose}
            >
              {isClosing ? <Spinner /> : null}
              {t("close")}
            </Button>
          ) : null}
          {canAbandon ? (
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onAbandon}
            >
              {t("abandon")}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
