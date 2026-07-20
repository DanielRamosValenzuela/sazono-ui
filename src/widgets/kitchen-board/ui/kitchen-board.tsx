"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock3,
  Flame,
  GripVertical,
  Soup,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";
import { kitchenApi } from "@/shared/api/kitchen-api";
import { menusApi } from "@/shared/api/menus-api";
import {
  getBranchAccessList,
  hasBranchPermission,
  type BranchAccess,
} from "@/shared/lib/branch-access";
import type { BranchRole } from "@/shared/types/auth";
import type { StationTicket, StationTicketStatus } from "@/shared/types/kitchen";
import { SelectInput } from "@/shared/ui/form-controls";

const STATION_TICKET_STATUSES: StationTicketStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "READY",
  "CANCELLED",
];

const KITCHEN_READ_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR", "KITCHEN", "BAR"];
const KITCHEN_CANCEL_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR"];
const TICKETS_REFETCH_INTERVAL = 8_000;

const BOARD_COLUMNS: {
  status: StationTicketStatus;
  icon: typeof Clock3;
  nextStatus: StationTicketStatus | null;
}[] = [
  { status: "PENDING", icon: Clock3, nextStatus: "IN_PROGRESS" },
  { status: "IN_PROGRESS", icon: Soup, nextStatus: "READY" },
  { status: "READY", icon: CheckCircle2, nextStatus: null },
];

function formatTime(locale: string, value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function KitchenBoard() {
  const t = useTranslations("KitchenBoard");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const session = useAdminSession();
  const accessToken = session.accessToken;

  const branchAccessList = useMemo(
    () => (session.user ? getBranchAccessList(session.user) : []),
    [session.user]
  );

  const [rawSelectedBranchId, setSelectedBranchId] = useState("");
  const selectedBranchId = branchAccessList.some(
    (branch) => branch.branchId === rawSelectedBranchId
  )
    ? rawSelectedBranchId
    : branchAccessList[0]?.branchId ?? "";

  const selectedBranch: BranchAccess | null =
    branchAccessList.find((branch) => branch.branchId === selectedBranchId) ?? null;

  const canReadKitchen = hasBranchPermission(selectedBranch, KITCHEN_READ_ROLES);
  const canCancel = hasBranchPermission(selectedBranch, KITCHEN_CANCEL_ROLES);

  const [selectedStationId, setSelectedStationId] = useState("");

  const stationsQuery = useQuery({
    queryKey: ["kitchen", "stations", accessToken, selectedBranchId],
    queryFn: () => menusApi.listPreparationStations(accessToken!, selectedBranchId),
    enabled: session.isClientReady && Boolean(accessToken) && Boolean(selectedBranchId) && canReadKitchen,
  });

  const ticketsQuery = useQuery({
    queryKey: ["kitchen", "tickets", accessToken, selectedBranchId, selectedStationId],
    queryFn: () =>
      kitchenApi.listStationTickets(accessToken!, {
        branchId: selectedBranchId,
        ...(selectedStationId ? { preparationStationId: selectedStationId } : {}),
      }),
    enabled: session.isClientReady && Boolean(accessToken) && Boolean(selectedBranchId) && canReadKitchen,
    refetchInterval: TICKETS_REFETCH_INTERVAL,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      stationTicketId,
      status,
    }: {
      stationTicketId: string;
      status: StationTicketStatus;
    }) => kitchenApi.updateStationTicketStatus(accessToken!, stationTicketId, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kitchen", "tickets"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("updateError"));
    },
  });

  const tickets = useMemo(() => ticketsQuery.data ?? [], [ticketsQuery.data]);

  const ticketsByStatus = useMemo(() => {
    const grouped = new Map<StationTicketStatus, StationTicket[]>();

    for (const ticket of tickets) {
      const list = grouped.get(ticket.status) ?? [];
      list.push(ticket);
      grouped.set(ticket.status, list);
    }

    return grouped;
  }, [tickets]);

  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const targetStatus = over.id as StationTicketStatus;

    if (!STATION_TICKET_STATUSES.includes(targetStatus)) {
      return;
    }

    const ticket = tickets.find(
      (candidate) => candidate.stationTicketId === active.id
    );

    if (!ticket || ticket.status === targetStatus) {
      return;
    }

    updateStatusMutation.mutate({
      stationTicketId: ticket.stationTicketId,
      status: targetStatus,
    });
  };

  if (!session.isClientReady) {
    return <Skeleton className="h-96 w-full rounded-3xl" />;
  }

  if (branchAccessList.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-background/45 p-8 text-center text-sm leading-7 text-muted-foreground">
        {t("noRolesDescription")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-52">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("branchLabel")}
          </label>
          <SelectInput
            value={selectedBranchId}
            onChange={(event) => setSelectedBranchId(event.target.value)}
          >
            {branchAccessList.map((branch) => (
              <option key={branch.branchId} value={branch.branchId}>
                {branch.branchName}
              </option>
            ))}
          </SelectInput>
        </div>

        <div className="min-w-52">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("stationLabel")}
          </label>
          <SelectInput
            value={selectedStationId}
            onChange={(event) => setSelectedStationId(event.target.value)}
            disabled={!canReadKitchen}
          >
            <option value="">{t("stationAll")}</option>
            {(stationsQuery.data ?? []).map((station) => (
              <option key={station.preparationStationId} value={station.preparationStationId}>
                {station.name}
              </option>
            ))}
          </SelectInput>
        </div>
      </div>

      {!canReadKitchen ? (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/8 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{t("readForbiddenDescription")}</p>
        </div>
      ) : (
        <DndContext
          sensors={dragSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {BOARD_COLUMNS.map((column) => {
              const columnTickets = ticketsByStatus.get(column.status) ?? [];

              return (
                <KitchenColumn key={column.status} column={column} count={columnTickets.length}>
                  {ticketsQuery.isPending ? (
                    <>
                      <Skeleton className="h-28 w-full rounded-2xl" />
                      <Skeleton className="h-28 w-full rounded-2xl" />
                    </>
                  ) : null}

                  {!ticketsQuery.isPending && columnTickets.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-4 text-center text-xs text-muted-foreground">
                      {t("columnEmpty")}
                    </p>
                  ) : null}

                  {columnTickets.map((ticket) => {
                    const isUpdating =
                      updateStatusMutation.isPending &&
                      updateStatusMutation.variables?.stationTicketId === ticket.stationTicketId;
                    const sentTime = formatTime(locale, ticket.sentAt);

                    return (
                      <DraggableTicketCard
                        key={ticket.stationTicketId}
                        ticket={ticket}
                        disabled={isUpdating}
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline">{ticket.tableCode}</Badge>
                          <Badge variant="secondary">
                            {t(`source_${ticket.orderSource}`)}
                          </Badge>
                          {sentTime ? (
                            <span className="ml-auto text-xs text-muted-foreground">
                              {sentTime}
                            </span>
                          ) : null}
                        </div>

                        <ul className="mt-2.5 space-y-1 text-sm">
                          {ticket.items.map((item) => (
                            <li key={item.stationTicketItemId} className="text-foreground">
                              <span className="font-semibold tabular-nums">
                                {item.quantity}×
                              </span>{" "}
                              {item.name}
                              {item.notes ? (
                                <span className="block pl-4 text-xs text-muted-foreground">
                                  {item.notes}
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>

                        {ticket.orderNotes ? (
                          <p className="mt-2 rounded-lg bg-accent/25 px-2.5 py-1.5 text-xs leading-5 text-accent-foreground">
                            {ticket.orderNotes}
                          </p>
                        ) : null}

                        <div className="mt-3 flex items-center gap-1.5">
                          {column.nextStatus ? (
                            <Button
                              type="button"
                              size="sm"
                              className="flex-1 rounded-full"
                              disabled={isUpdating}
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  stationTicketId: ticket.stationTicketId,
                                  status: column.nextStatus as StationTicketStatus,
                                })
                              }
                            >
                              {isUpdating ? <Spinner /> : <Flame className="size-3.5" />}
                              {t(`advanceTo_${column.nextStatus}`)}
                            </Button>
                          ) : (
                            <span className="flex-1 text-center text-xs text-muted-foreground">
                              {t("readyHint")}
                            </span>
                          )}

                          {canCancel ? (
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label={t("cancelTicket")}
                              disabled={isUpdating}
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  stationTicketId: ticket.stationTicketId,
                                  status: "CANCELLED",
                                })
                              }
                            >
                              <Ban className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      </DraggableTicketCard>
                    );
                  })}
                </KitchenColumn>
              );
            })}
          </div>
        </DndContext>
      )}
    </div>
  );
}

type KitchenColumnProps = {
  column: (typeof BOARD_COLUMNS)[number];
  count: number;
  children: ReactNode;
};

function KitchenColumn({ column, count, children }: KitchenColumnProps) {
  const tStatus = useTranslations("Shared.stationTicketStatus");
  const { setNodeRef, isOver } = useDroppable({ id: column.status });
  const Icon = column.icon;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-[1.7rem] border p-4 transition-colors",
        isOver
          ? "border-primary/50 bg-primary/5"
          : "border-border/70 bg-card/70"
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <Icon className="size-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          {tStatus(column.status)}
        </h2>
        <span className="ml-auto inline-flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
          {count}
        </span>
      </div>

      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

type DraggableTicketCardProps = {
  ticket: StationTicket;
  disabled: boolean;
  children: ReactNode;
};

function DraggableTicketCard({ ticket, disabled, children }: DraggableTicketCardProps) {
  const t = useTranslations("KitchenBoard");
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.stationTicketId,
    disabled,
  });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.6 : 1,
      }}
      className="relative rounded-2xl border border-border/70 bg-background/70 p-3.5 pl-8 shadow-sm"
    >
      <button
        type="button"
        className="absolute top-3.5 left-1.5 cursor-grab touch-none rounded-full p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={t("ticketDragHandle")}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
      {children}
    </article>
  );
}
