"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  Copy,
  CircleDot,
  ClipboardList,
  DoorOpen,
  Plus,
  QrCode,
  RefreshCcw,
  Wallet,
  Sparkles,
  UserCheck,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";
import { adminApi } from "@/shared/api/admin-api";
import { billingApi } from "@/shared/api/billing-api";
import { floorApi } from "@/shared/api/floor-api";
import { ordersApi } from "@/shared/api/orders-api";
import {
  getBranchAccessList,
  hasBranchPermission,
  type BranchAccess,
} from "@/shared/lib/branch-access";
import { formatMoney } from "@/shared/lib/format";
import type { BranchRole } from "@/shared/types/auth";
import type { BranchOpenBill, CurrentBill } from "@/shared/types/billing";
import type {
  FloorTable,
  TableSessionSource,
  TableSessionStatus,
} from "@/shared/types/floor";
import type { BranchReadySummaryItem, OrderResponse } from "@/shared/types/order";
import {
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { AbandonSessionDialog } from "./abandon-session-dialog";
import { AddOrderSheet } from "./add-order-sheet";
import { SplitBillDialog } from "./split-bill-dialog";

interface CreateTableFormValues {
  code: string;
  name: string;
  capacity: number;
}

interface CloseSessionFormValues {
  closeReason: string;
}

type TableFilter = "all" | "available" | "occupied" | "pending" | "stale";

const STALE_SESSION_MINUTES = 30;
const READY_SUMMARY_REFETCH_INTERVAL = 12_000;
const LIVE_TIMER_TICK_INTERVAL = 30_000;

const TABLE_FILTERS: TableFilter[] = ["all", "available", "occupied", "pending", "stale"];

const FLOOR_READ_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR", "WAITER", "CASHIER", "KITCHEN"];
const FLOOR_CREATE_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR"];
const FLOOR_MULTI_SOURCE_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR"];
const FLOOR_ORDER_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR", "WAITER", "CASHIER", "KITCHEN"];
const FLOOR_SPLIT_BILL_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR", "CASHIER"];
const FLOOR_ABANDON_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR", "CASHIER"];
const FLOOR_DELIVER_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR", "CASHIER", "WAITER", "KITCHEN"];
const FLOOR_ASSIGN_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR", "WAITER", "CASHIER"];
const FLOOR_REASSIGN_ANYONE_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR"];

function getOpenSources(branchAccess: BranchAccess | null): TableSessionSource[] {
  if (!branchAccess) {
    return [];
  }

  if (branchAccess.roles.some((role) => FLOOR_MULTI_SOURCE_ROLES.includes(role))) {
    return ["WAITER", "CASHIER"];
  }

  const nextSources: TableSessionSource[] = [];

  if (branchAccess.roles.includes("WAITER")) {
    nextSources.push("WAITER");
  }

  if (branchAccess.roles.includes("CASHIER")) {
    nextSources.push("CASHIER");
  }

  return nextSources;
}

function getTableStatusTone(status: FloorTable["status"]) {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300";
    case "OCCUPIED":
      return "bg-amber-500/12 text-amber-700 dark:text-amber-300";
    case "DISABLED":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

function getSessionStatusTone(status: TableSessionStatus) {
  switch (status) {
    case "OPEN":
      return "bg-primary/12 text-primary";
    case "PAYMENT_COMPLETED":
      return "bg-accent/35 text-accent-foreground";
    case "CLOSED":
      return "bg-secondary text-secondary-foreground";
    case "ABANDONED":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

type TableTileState = "available" | "occupied" | "paid" | "pending" | "disabled";

const TABLE_TILE_LEGEND_STATES: TableTileState[] = [
  "available",
  "occupied",
  "paid",
  "pending",
  "disabled",
];

function getTableTileState(table: FloorTable, remaining: number): TableTileState {
  if (table.status === "DISABLED") {
    return "disabled";
  }

  const session = table.currentSession;
  if (!session) {
    return "available";
  }

  if (remaining > 0) {
    return "pending";
  }

  return session.status === "PAYMENT_COMPLETED" ? "paid" : "occupied";
}

function getTileToneClasses(state: TableTileState) {
  switch (state) {
    case "available":
      return "bg-emerald-500/12 text-emerald-700 ring-emerald-500/35 dark:text-emerald-300";
    case "occupied":
      return "bg-primary/12 text-primary ring-primary/35";
    case "paid":
      return "bg-sky-500/12 text-sky-700 ring-sky-500/35 dark:text-sky-300";
    case "pending":
      return "bg-destructive/12 text-destructive ring-destructive/35";
    case "disabled":
      return "bg-muted text-muted-foreground ring-border";
  }
}

function getTileDotClasses(state: TableTileState) {
  switch (state) {
    case "available":
      return "bg-emerald-500";
    case "occupied":
      return "bg-primary";
    case "paid":
      return "bg-sky-500";
    case "pending":
      return "bg-destructive";
    case "disabled":
      return "bg-muted-foreground";
  }
}

function getTileStatusLabel(
  t: ReturnType<typeof useTranslations<"FloorConsole">>,
  state: TableTileState
) {
  switch (state) {
    case "available":
      return t("tableStatus_AVAILABLE");
    case "occupied":
      return t("tableStatus_OCCUPIED");
    case "paid":
      return t("tileStatus_PAID");
    case "pending":
      return t("tablesFilter_pending");
    case "disabled":
      return t("tableStatus_DISABLED");
  }
}

function formatDateTime(locale: string, value: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatElapsedMinutes(openedAt: string, now: number) {
  const minutes = Math.max(0, Math.floor((now - new Date(openedAt).getTime()) / 60_000));

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h ${remainder}m`;
}

function isSessionStale(openedAt: string, now: number) {
  return now - new Date(openedAt).getTime() >= STALE_SESSION_MINUTES * 60_000;
}

function isBillSettled(bill: CurrentBill | undefined) {
  return bill ? Number(bill.remainingAmount) <= 0 : false;
}

export function FloorConsole() {
  const t = useTranslations("FloorConsole");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const session = useAdminSession();
  const accessToken = session.accessToken;
  const currentUser = session.user;
  const branchAccessList = useMemo(
    () => (currentUser ? getBranchAccessList(currentUser) : []),
    [currentUser]
  );

  const [rawSelectedBranchId, setSelectedBranchId] = useState<string>("");
  const [rawSelectedSource, setSelectedSource] = useState<TableSessionSource>("WAITER");
  const [rawFocusedTableId, setFocusedTableId] = useState<string>("");
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [addOrderOpen, setAddOrderOpen] = useState(false);
  const [abandonOpen, setAbandonOpen] = useState(false);
  const [splitBillOpen, setSplitBillOpen] = useState(false);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), LIVE_TIMER_TICK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const selectedBranchId = branchAccessList.some(
    (branch) => branch.branchId === rawSelectedBranchId
  )
    ? rawSelectedBranchId
    : branchAccessList[0]?.branchId ?? "";

  const selectedBranch =
    branchAccessList.find((branch) => branch.branchId === selectedBranchId) ?? null;
  const availableOpenSources = useMemo(() => getOpenSources(selectedBranch), [selectedBranch]);
  const selectedSource = availableOpenSources.includes(rawSelectedSource)
    ? rawSelectedSource
    : availableOpenSources[0] ?? "WAITER";

  const canReadFloor = hasBranchPermission(selectedBranch, FLOOR_READ_ROLES);
  const canCreateTables = hasBranchPermission(selectedBranch, FLOOR_CREATE_ROLES);
  const canAddOrder = hasBranchPermission(selectedBranch, FLOOR_ORDER_ROLES);
  const canDeliver = hasBranchPermission(selectedBranch, FLOOR_DELIVER_ROLES);
  const canSplitBill = hasBranchPermission(
    selectedBranch,
    FLOOR_SPLIT_BILL_ROLES,
  );

  const { data: branchesData } = useQuery({
    queryKey: ["floor", "branch-settings", accessToken],
    enabled: session.isClientReady && Boolean(accessToken) && canReadFloor,
    queryFn: () => adminApi.listBranches(accessToken!),
  });
  const isSplitBillEnabled =
    branchesData?.find((branch) => branch.branchId === selectedBranchId)?.settings
      ?.splitBillEnabled ?? false;
  const isTableAssignmentEnabled =
    branchesData?.find((branch) => branch.branchId === selectedBranchId)?.settings
      ?.tableAssignmentEnabled ?? false;
  const canReassignAnyone = hasBranchPermission(
    selectedBranch,
    FLOOR_REASSIGN_ANYONE_ROLES,
  );

  const { data: staffListData, isLoading: isStaffListLoading } = useQuery({
    queryKey: ["admin", "staff-list", accessToken],
    enabled:
      session.isClientReady &&
      Boolean(accessToken) &&
      isTableAssignmentEnabled &&
      canReassignAnyone,
    queryFn: () => adminApi.listStaff(accessToken!),
  });
  const assignableStaffOptions = useMemo(() => {
    if (!staffListData) {
      return [];
    }
    return staffListData
      .filter(
        (staffUser) =>
          staffUser.status === "ACTIVE" &&
          staffUser.branchRoles.some(
            (branchRole) =>
              branchRole.branchId === selectedBranchId &&
              FLOOR_ASSIGN_ROLES.includes(branchRole.role),
          ),
      )
      .map((staffUser) => ({
        staffUserId: staffUser.staffUserId,
        name: `${staffUser.firstName} ${staffUser.lastName}`.trim(),
      }));
  }, [staffListData, selectedBranchId]);

  const {
    data: tablesData,
    isLoading: isTablesLoading,
    isError: isTablesError,
    error: tablesError,
  } = useQuery({
    queryKey: ["floor", "tables", accessToken, selectedBranchId],
    enabled:
      session.isClientReady &&
      Boolean(accessToken) &&
      Boolean(selectedBranchId) &&
      canReadFloor,
    retry: false,
    queryFn: () => floorApi.listTables(accessToken!, selectedBranchId),
  });

  const allTables = useMemo(() => tablesData ?? [], [tablesData]);

  const { data: openBillsData } = useQuery({
    queryKey: ["billing", "open-bills", accessToken, selectedBranchId],
    enabled:
      session.isClientReady &&
      Boolean(accessToken) &&
      Boolean(selectedBranchId) &&
      canReadFloor,
    refetchInterval: 15_000,
    queryFn: () => billingApi.listBranchOpenBills(accessToken!, selectedBranchId),
  });
  const openBillsByTableId = useMemo(() => {
    const map = new Map<string, BranchOpenBill>();
    for (const bill of openBillsData ?? []) {
      map.set(bill.tableId, bill);
    }
    return map;
  }, [openBillsData]);

  const { data: readySummaryData } = useQuery({
    queryKey: ["orders", "branch-ready-summary", accessToken, selectedBranchId],
    enabled:
      session.isClientReady &&
      Boolean(accessToken) &&
      Boolean(selectedBranchId) &&
      canReadFloor,
    refetchInterval: READY_SUMMARY_REFETCH_INTERVAL,
    queryFn: () => ordersApi.listBranchReadySummary(accessToken!, selectedBranchId),
  });

  const [myTablesOnly, setMyTablesOnly] = useState(true);
  const readySummary = useMemo(() => readySummaryData ?? [], [readySummaryData]);
  const visibleReadySummary = useMemo(() => {
    if (!myTablesOnly || !currentUser) {
      return readySummary;
    }
    return readySummary.filter((entry) =>
      isTableAssignmentEnabled
        ? entry.assignedStaffUserId === currentUser.profileId
        : entry.openedByStaffUserId === currentUser.profileId
    );
  }, [readySummary, myTablesOnly, currentUser, isTableAssignmentEnabled]);
  const readySummaryByTableId = useMemo(() => {
    const map = new Map<string, BranchReadySummaryItem>();
    for (const entry of visibleReadySummary) {
      map.set(entry.tableId, entry);
    }
    return map;
  }, [visibleReadySummary]);

  const [tableFilter, setTableFilter] = useState<TableFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const tables = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allTables.filter((table) => {
      if (query) {
        const matchesQuery =
          table.name.toLowerCase().includes(query) ||
          table.code.toLowerCase().includes(query);
        if (!matchesQuery) {
          return false;
        }
      }

      switch (tableFilter) {
        case "available":
          return table.status === "AVAILABLE";
        case "occupied":
          return table.status === "OCCUPIED";
        case "pending": {
          const bill = openBillsByTableId.get(table.tableId);
          return Boolean(bill && Number(bill.remainingAmount) > 0);
        }
        case "stale":
          return Boolean(
            table.currentSession && isSessionStale(table.currentSession.openedAt, now)
          );
        default:
          return true;
      }
    });
  }, [allTables, tableFilter, searchQuery, openBillsByTableId, now]);

  const focusedTableId = allTables.some((table) => table.tableId === rawFocusedTableId)
    ? rawFocusedTableId
    : "";
  const focusedTable = allTables.find((table) => table.tableId === focusedTableId) ?? null;

  const openTableDetail = (tableId: string) => {
    setFocusedTableId(tableId);
    setDetailSheetOpen(true);
  };

  const {
    data: currentSessionData,
    isFetching: isCurrentSessionFetching,
    isError: isCurrentSessionError,
    error: currentSessionError,
  } = useQuery({
    queryKey: ["floor", "current-session", accessToken, focusedTableId],
    enabled:
      session.isClientReady &&
      Boolean(accessToken) &&
      Boolean(focusedTableId) &&
      Boolean(focusedTable?.currentSession) &&
      canReadFloor,
    retry: false,
    queryFn: () => floorApi.getCurrentSession(accessToken!, focusedTableId),
  });
  const focusedSessionSource =
    currentSessionData?.openedBySource ?? focusedTable?.currentSession?.openedBySource;
  const activeSessionId =
    currentSessionData?.tableSessionId ?? focusedTable?.currentSession?.tableSessionId ?? "";
  const focusedAssignedStaffUserId =
    currentSessionData?.assignedStaffUserId ??
    focusedTable?.currentSession?.assignedStaffUserId ??
    null;

  const {
    data: currentBill,
    isLoading: isCurrentBillLoading,
    error: currentBillError,
  } = useQuery({
    queryKey: ["billing", "current-bill", accessToken, activeSessionId],
    enabled:
      session.isClientReady &&
      Boolean(accessToken) &&
      Boolean(activeSessionId) &&
      canReadFloor,
    retry: false,
    queryFn: () => billingApi.getCurrentBill(accessToken!, activeSessionId),
  });

  const {
    data: sessionOrdersData,
    isLoading: isSessionOrdersLoading,
  } = useQuery({
    queryKey: ["orders", "session", accessToken, activeSessionId],
    enabled:
      session.isClientReady &&
      Boolean(accessToken) &&
      Boolean(activeSessionId) &&
      detailSheetOpen,
    queryFn: () => ordersApi.listSessionOrders(accessToken!, activeSessionId),
  });
  const sessionOrders = useMemo(() => sessionOrdersData ?? [], [sessionOrdersData]);

  const deliverOrderMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.deliverOrder(accessToken!, orderId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders", "session"] }),
        queryClient.invalidateQueries({ queryKey: ["orders", "branch-ready-summary"] }),
      ]);
      toast.success(t("deliverSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("deliverError"));
    },
  });

  const createTableForm = useForm<CreateTableFormValues>({
    defaultValues: {
      code: "",
      name: "",
      capacity: 4,
    },
  });
  const closeSessionForm = useForm<CloseSessionFormValues>({
    defaultValues: {
      closeReason: "",
    },
  });

  const createTableMutation = useMutation({
    mutationFn: (values: CreateTableFormValues) =>
      floorApi.createTable(accessToken!, {
        branchId: selectedBranchId,
        code: values.code.trim(),
        name: values.name.trim(),
        capacity: values.capacity,
      }),
    onSuccess: (table) => {
      createTableForm.reset({
        code: "",
        name: "",
        capacity: table.capacity,
      });
      setFocusedTableId(table.tableId);
      void queryClient.invalidateQueries({
        queryKey: ["floor", "tables"],
      });
      toast.success(t("createSuccess", { name: table.name }));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("createError"));
    },
  });

  const openTableMutation = useMutation({
    mutationFn: (table: FloorTable) =>
      floorApi.openTableSession(accessToken!, {
        tableId: table.tableId,
        openedBySource: selectedSource,
      }),
    onSuccess: async (openedSession) => {
      setFocusedTableId(openedSession.tableId);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["floor", "tables"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["floor", "current-session", accessToken, openedSession.tableId],
        }),
      ]);
      toast.success(t("openSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("openError"));
    },
  });
  const closeTableMutation = useMutation({
    mutationFn: ({
      sessionId,
      values,
    }: {
      sessionId: string;
      values: CloseSessionFormValues;
    }) =>
      floorApi.closeTableSession(accessToken!, sessionId, {
        closeReason: values.closeReason.trim() || t("closeReasonDefault"),
      }),
    onSuccess: async (closedSession) => {
      closeSessionForm.reset({
        closeReason: "",
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["floor", "tables"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["floor", "current-session"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["billing", "current-bill"],
        }),
      ]);
      setFocusedTableId(closedSession.tableId);
      setDetailSheetOpen(false);
      toast.success(t("closeSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("closeError"));
    },
  });
  const assignTableMutation = useMutation({
    mutationFn: ({
      sessionId,
      staffUserId,
    }: {
      sessionId: string;
      staffUserId?: string;
    }) =>
      floorApi.assignTableSession(
        accessToken!,
        sessionId,
        staffUserId ? { staffUserId } : {},
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["floor", "tables"] }),
        queryClient.invalidateQueries({ queryKey: ["floor", "current-session"] }),
        queryClient.invalidateQueries({
          queryKey: ["orders", "branch-ready-summary"],
        }),
      ]);
      toast.success(t("assignSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("assignError"));
    },
  });

  const totalTables = tables.length;
  const availableTables = tables.filter((table) => table.status === "AVAILABLE").length;
  const occupiedTables = tables.filter((table) => table.status === "OCCUPIED").length;

  if (!session.isClientReady) {
    return (
      <Card className="rounded-[1.75rem] border-border/70 bg-card/82 shadow-lg shadow-primary/8">
        <CardContent className="space-y-3 p-6">
          <span className="sr-only">{t("preparing")}</span>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!accessToken || !currentUser) {
    return (
      <NoticeCard
        title={t("requireLoginTitle")}
        description={t("requireLoginDescription")}
        actionHref="/admin"
        actionLabel={t("goAdmin")}
      />
    );
  }

  if (currentUser.profileType !== "staff") {
    return (
      <NoticeCard
        title={t("wrongProfileTitle")}
        description={t("wrongProfileDescription")}
        actionHref="/admin"
        actionLabel={t("goAdmin")}
      />
    );
  }

  if (!branchAccessList.length) {
    return (
      <InlineError
        title={t("noRolesTitle")}
        description={t("noRolesDescription")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[1.9rem] border border-border/70 bg-card/86 shadow-xl shadow-primary/10 backdrop-blur">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">
                {t("workspaceBadge")}
              </Badge>
              <Badge variant="outline">{currentUser.firstName} {currentUser.lastName}</Badge>
            </div>

            <div>
              <h2 className="font-heading text-3xl font-semibold tracking-tight">
                {t("workspaceTitle")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                {t("workspaceDescription")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedBranch?.roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup>
              <FieldLabel htmlFor="floor-branch">{t("branchLabel")}</FieldLabel>
              <SelectInput
                id="floor-branch"
                value={selectedBranchId}
                onChange={(event) => setSelectedBranchId(event.target.value)}
              >
                {branchAccessList.map((branch) => (
                  <option key={branch.branchId} value={branch.branchId}>
                    {branch.branchName}
                  </option>
                ))}
              </SelectInput>
              <FieldHint>{t("branchHint")}</FieldHint>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="floor-source">{t("sourceLabel")}</FieldLabel>
              <SelectInput
                id="floor-source"
                value={selectedSource}
                onChange={(event) =>
                  setSelectedSource(event.target.value as TableSessionSource)
                }
                disabled={!availableOpenSources.length}
              >
                {availableOpenSources.map((source) => (
                  <option key={source} value={source}>
                    {source === "WAITER" ? t("sourceWaiter") : t("sourceCashier")}
                  </option>
                ))}
              </SelectInput>
              <FieldHint>{t("sourceHint")}</FieldHint>
            </FieldGroup>
          </div>
        </CardContent>
      </Card>

      {session.userError ? (
        <InlineError
          title={t("refreshTitle")}
          description={
            session.userError instanceof Error
              ? session.userError.message
              : t("refreshDescription")
          }
        />
      ) : null}

      {!canReadFloor ? (
        <InlineError
          title={t("readForbiddenTitle")}
          description={t("readForbiddenDescription")}
        />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard
              icon={UtensilsCrossed}
              label={t("metricTables")}
              value={String(totalTables)}
            />
            <MetricCard
              icon={CircleDot}
              label={t("metricAvailable")}
              value={String(availableTables)}
            />
            <MetricCard
              icon={DoorOpen}
              label={t("metricOccupied")}
              value={String(occupiedTables)}
            />
          </section>

          {visibleReadySummary.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-[1.5rem] border border-primary/20 bg-primary/6 p-3">
              <Bell className="size-4 shrink-0 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {t("readyStripTitle")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {visibleReadySummary.map((entry) => (
                  <button
                    key={entry.tableSessionId}
                    type="button"
                    onClick={() => openTableDetail(entry.tableId)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-primary/25 bg-card px-3 py-1 text-xs font-medium text-foreground transition hover:bg-primary/10"
                  >
                    {entry.tableCode}
                    <Badge className="border-0 bg-primary/15 px-1.5 text-primary">
                      {entry.readyUndeliveredCount}
                    </Badge>
                  </button>
                ))}
              </div>
              <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={myTablesOnly}
                  onChange={(event) => setMyTablesOnly(event.target.checked)}
                  className="size-3.5 cursor-pointer rounded border-border accent-primary"
                />
                {t("myTablesOnly")}
              </label>
            </div>
          ) : null}

          <Card className="rounded-[1.9rem] border border-border/70 bg-card/82 shadow-lg shadow-primary/8 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <Plus className="size-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em]">
                  {t("createEyebrow")}
                </p>
              </div>
              <CardTitle className="text-2xl">{t("createTitle")}</CardTitle>
              <CardDescription className="leading-7">
                {canCreateTables ? t("createDescription") : t("createForbidden")}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={createTableForm.handleSubmit((values) =>
                  createTableMutation.mutate(values)
                )}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
              >
                <FieldGroup>
                  <FieldLabel htmlFor="table-code">{t("codeLabel")}</FieldLabel>
                  <TextInput
                    id="table-code"
                    placeholder="M01"
                    disabled={!canCreateTables || createTableMutation.isPending}
                    {...createTableForm.register("code", { required: true })}
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="table-name">{t("nameLabel")}</FieldLabel>
                  <TextInput
                    id="table-name"
                    placeholder={t("namePlaceholder")}
                    disabled={!canCreateTables || createTableMutation.isPending}
                    {...createTableForm.register("name", { required: true })}
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="table-capacity">{t("capacityLabel")}</FieldLabel>
                  <TextInput
                    id="table-capacity"
                    type="number"
                    min={1}
                    max={24}
                    disabled={!canCreateTables || createTableMutation.isPending}
                    {...createTableForm.register("capacity", {
                      required: true,
                      valueAsNumber: true,
                      min: 1,
                    })}
                  />
                </FieldGroup>

                <Button
                  type="submit"
                  size="lg"
                  className="rounded-full"
                  disabled={!canCreateTables || createTableMutation.isPending}
                >
                  {createTableMutation.isPending ? (
                    <>
                      <Spinner />
                      {t("createSubmitting")}
                    </>
                  ) : (
                    t("createSubmit")
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <TableQrCard locale={locale} t={t} table={focusedTable} />

          <Card className="rounded-[1.9rem] border border-border/70 bg-card/82 shadow-lg shadow-primary/8 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <ClipboardList className="size-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em]">
                  {t("tablesEyebrow")}
                </p>
              </div>
              <CardTitle className="text-2xl">{t("tablesTitle")}</CardTitle>
              <CardDescription className="leading-7">
                {t("tablesDescription")}
              </CardDescription>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
                  {t("tilesLegendLabel")}
                </span>
                {TABLE_TILE_LEGEND_STATES.map((state) => (
                  <span key={state} className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className={cn("size-2.5 shrink-0 rounded-full", getTileDotClasses(state))}
                    />
                    {getTileStatusLabel(t, state)}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5">
                  <Clock aria-hidden className="size-3 shrink-0 text-orange-500" />
                  {t("tablesFilter_stale")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Bell aria-hidden className="size-3 shrink-0 text-primary" />
                  {t("tilesLegendReady")}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {TABLE_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setTableFilter(filter)}
                    className={cn(
                      "cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                      tableFilter === filter
                        ? "border-primary/40 bg-primary text-primary-foreground"
                        : "border-border/80 bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(`tablesFilter_${filter}`)}
                  </button>
                ))}
              </div>

              <div className="mt-3 max-w-sm">
                <TextInput
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t("tablesSearchPlaceholder")}
                  aria-label={t("tablesSearchPlaceholder")}
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {isTablesLoading ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <Skeleton className="h-44 w-full rounded-[1.6rem]" />
                  <Skeleton className="h-44 w-full rounded-[1.6rem]" />
                  <Skeleton className="h-44 w-full rounded-[1.6rem]" />
                </div>
              ) : null}

              {isTablesError ? (
                <InlineError
                  title={t("tablesErrorTitle")}
                  description={
                    tablesError instanceof Error
                      ? tablesError.message
                      : t("tablesErrorDescription")
                  }
                />
              ) : null}

              {!isTablesLoading && !tables.length ? (
                <div className="rounded-[1.5rem] border border-dashed border-border bg-background/45 p-5 text-sm leading-7 text-muted-foreground">
                  {t("tablesEmpty")}
                </div>
              ) : null}

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                {tables.map((table) => {
                  const readyEntry = readySummaryByTableId.get(table.tableId);
                  const bill = openBillsByTableId.get(table.tableId);
                  const remaining = bill ? Number(bill.remainingAmount) : 0;
                  const tileState = getTableTileState(table, remaining);
                  const elapsed = table.currentSession
                    ? formatElapsedMinutes(table.currentSession.openedAt, now)
                    : null;
                  const stale = Boolean(
                    table.currentSession && isSessionStale(table.currentSession.openedAt, now)
                  );

                  const ariaLabelParts = [table.code, getTileStatusLabel(t, tileState)];
                  if (elapsed) {
                    ariaLabelParts.push(t("tileAriaOpenSince", { elapsed }));
                  }
                  if (stale) {
                    ariaLabelParts.push(t("tablesFilter_stale"));
                  }
                  if (readyEntry) {
                    ariaLabelParts.push(
                      t("readyBadge", { count: readyEntry.readyUndeliveredCount })
                    );
                  }
                  const ariaLabel = ariaLabelParts.join(", ");

                  return (
                    <button
                      key={table.tableId}
                      type="button"
                      onClick={() => openTableDetail(table.tableId)}
                      aria-label={ariaLabel}
                      title={ariaLabel}
                      className={cn(
                        "flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition hover:shadow-md",
                        readyEntry
                          ? "border-primary/45 bg-primary/6 shadow-md shadow-primary/10"
                          : tileState === "pending"
                            ? "border-destructive/30 bg-destructive/4"
                            : "border-border/70 bg-background/55"
                      )}
                    >
                      <span
                        className={cn(
                          "relative flex size-12 shrink-0 items-center justify-center rounded-full ring-2",
                          getTileToneClasses(tileState)
                        )}
                      >
                        <UtensilsCrossed className="size-5" />
                        {readyEntry ? (
                          <span className="absolute -top-1 -right-1 flex size-[1.15rem] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-card">
                            {readyEntry.readyUndeliveredCount}
                          </span>
                        ) : null}
                        {stale ? (
                          <span className="absolute -bottom-1 -left-1 flex size-[1.15rem] items-center justify-center rounded-full bg-orange-500 text-white ring-2 ring-card">
                            <Clock className="size-2.5" />
                          </span>
                        ) : null}
                      </span>
                      <span className="text-sm font-semibold tabular-nums">{table.code}</span>
                      <span className="h-[1.05rem] text-[0.7rem] font-medium tabular-nums text-muted-foreground">
                        {elapsed ?? ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {detailSheetOpen && focusedTable ? (
        <TableDetailSheet
          accessToken={accessToken}
          branchId={selectedBranchId}
          table={focusedTable}
          session={currentSessionData}
          sessionSource={focusedSessionSource}
          activeSessionId={activeSessionId}
          isSessionFetching={isCurrentSessionFetching}
          isSessionError={isCurrentSessionError}
          sessionError={currentSessionError}
          orders={sessionOrders}
          isOrdersLoading={isSessionOrdersLoading}
          canAddOrder={canAddOrder}
          canDeliver={canDeliver}
          canOpenTable={
            isTableOpenable(focusedTable, availableOpenSources) && !focusedTable.currentSession
          }
          isOpeningTable={
            openTableMutation.isPending &&
            openTableMutation.variables?.tableId === focusedTable.tableId
          }
          onOpenTable={() => openTableMutation.mutate(focusedTable)}
          onDeliverOrder={(orderId) => deliverOrderMutation.mutate(orderId)}
          isDelivering={deliverOrderMutation.isPending}
          deliveringOrderId={deliverOrderMutation.variables}
          onAddOrderClick={() => setAddOrderOpen(true)}
          bill={currentBill}
          billError={currentBillError}
          canAbandon={hasBranchPermission(selectedBranch, FLOOR_ABANDON_ROLES)}
          canSplitBill={canSplitBill && isSplitBillEnabled}
          isTableAssignmentEnabled={isTableAssignmentEnabled}
          canReassignAnyone={canReassignAnyone}
          currentUserId={currentUser.profileId}
          assignedStaffUserId={focusedAssignedStaffUserId}
          assignableStaffOptions={assignableStaffOptions}
          isStaffListLoading={isStaffListLoading}
          isAssigning={assignTableMutation.isPending}
          onAssign={(staffUserId) => {
            if (!activeSessionId) {
              return;
            }
            assignTableMutation.mutate({ sessionId: activeSessionId, staffUserId });
          }}
          closeForm={closeSessionForm}
          isClosing={closeTableMutation.isPending}
          isLoadingBill={isCurrentBillLoading}
          isSettled={isBillSettled(currentBill)}
          locale={locale}
          onAbandonClick={() => setAbandonOpen(true)}
          onSplitBillClick={() => setSplitBillOpen(true)}
          onCloseSubmit={(values) => {
            if (!activeSessionId) {
              return;
            }
            closeTableMutation.mutate({ sessionId: activeSessionId, values });
          }}
          onRefresh={() => {
            void queryClient.invalidateQueries({
              queryKey: ["floor", "current-session", accessToken, focusedTable.tableId],
            });
          }}
          onClose={() => setDetailSheetOpen(false)}
          t={t}
        />
      ) : null}

      {addOrderOpen && activeSessionId ? (
        <AddOrderSheet
          accessToken={accessToken!}
          branchId={selectedBranchId}
          tableSessionId={activeSessionId}
          onClose={() => setAddOrderOpen(false)}
        />
      ) : null}

      {abandonOpen && activeSessionId ? (
        <AbandonSessionDialog
          accessToken={accessToken!}
          tableSessionId={activeSessionId}
          onClose={() => setAbandonOpen(false)}
        />
      ) : null}

      {splitBillOpen && currentBill ? (
        <SplitBillDialog
          accessToken={accessToken!}
          billId={currentBill.billId}
          remainingAmount={currentBill.remainingAmount}
          onClose={() => setSplitBillOpen(false)}
        />
      ) : null}
    </div>
  );
}

function isTableOpenable(table: FloorTable, availableOpenSources: TableSessionSource[]) {
  return table.status === "AVAILABLE" && availableOpenSources.length > 0;
}

interface MetricCardProps {
  icon: typeof UtensilsCrossed;
  label: string;
  value: string;
}

function MetricCard({ icon: Icon, label, value }: MetricCardProps) {
  return (
    <Card className="rounded-[1.7rem] border border-border/70 bg-card/82 shadow-lg shadow-primary/8 backdrop-blur">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-3 font-heading text-4xl leading-none">{value}</p>
        </div>
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

interface NoticeCardProps {
  title: string;
  description: string;
  actionHref: "/admin";
  actionLabel: string;
}

function NoticeCard({
  title,
  description,
  actionHref,
  actionLabel,
}: NoticeCardProps) {
  return (
    <Card className="rounded-[1.8rem] border border-border/70 bg-card/84 shadow-lg shadow-primary/8 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="max-w-2xl leading-7">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href={actionHref}
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/85"
        >
          {actionLabel}
        </Link>
      </CardContent>
    </Card>
  );
}

interface SessionDetailRowProps {
  label: string;
  value: string;
}

function SessionDetailRow({ label, value }: SessionDetailRowProps) {
  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-background/55 px-4 py-3">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}

interface InlineErrorProps {
  title: string;
  description: string;
}

function InlineError({ title, description }: InlineErrorProps) {
  return (
    <section className="rounded-[1.75rem] border border-destructive/20 bg-destructive/8 p-5 text-destructive">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-1 size-5 shrink-0" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-foreground/80">{description}</p>
        </div>
      </div>
    </section>
  );
}

interface TableQrCardProps {
  locale: string;
  t: ReturnType<typeof useTranslations<"FloorConsole">>;
  table: FloorTable | null;
}

function TableQrCard({ locale, t, table }: TableQrCardProps) {
  const qrUrl = useMemo(() => {
    if (!table || typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/${locale}/qr?table=${encodeURIComponent(table.qrToken)}`;
  }, [locale, table]);
  const { data: qrDataUrl } = useQuery({
    queryKey: ["floor", "qr-preview", qrUrl],
    enabled: Boolean(qrUrl),
    queryFn: () =>
      QRCode.toDataURL(qrUrl, {
        margin: 1,
        width: 240,
        color: {
          dark: "#2b1f18",
          light: "#f7f1e8",
        },
      }),
  });

  const copyQrUrl = async () => {
    if (!qrUrl) {
      return;
    }

    await navigator.clipboard.writeText(qrUrl);
  };

  const copyQrToken = async () => {
    if (!table?.qrToken) {
      return;
    }

    await navigator.clipboard.writeText(table.qrToken);
  };

  return (
    <Card className="rounded-[1.9rem] border border-border/70 bg-card/82 shadow-lg shadow-primary/8 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <QrCode className="size-4" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em]">
            {t("qrEyebrow")}
          </p>
        </div>
        <CardTitle className="text-2xl">{t("qrTitle")}</CardTitle>
        <CardDescription className="leading-7">
          {t("qrDescription")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {table ? (
          <div className="grid gap-5 md:grid-cols-[220px_1fr] md:items-start">
            <div className="rounded-[1.75rem] border border-primary/12 bg-primary/8 p-4">
              {qrDataUrl ? (
                <Image
                  src={qrDataUrl}
                  alt={t("qrAlt", { table: table.name })}
                  width={240}
                  height={240}
                  className="mx-auto aspect-square w-full rounded-2xl bg-white object-contain p-3"
                />
              ) : (
                <Skeleton className="aspect-square w-full rounded-2xl">
                  <span className="sr-only">{t("qrGenerating")}</span>
                </Skeleton>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{table.code}</Badge>
                  <Badge variant="secondary">{table.name}</Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {t("qrHelper")}
                </p>
              </div>

              <SessionDetailRow label={t("qrTokenLabel")} value={table.qrToken} />
              <SessionDetailRow label={t("qrUrlLabel")} value={qrUrl || t("qrGenerating")} />

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    void copyQrToken().then(() => toast.success(t("qrTokenCopied")));
                  }}
                  disabled={!table.qrToken}
                >
                  <Copy className="size-4" />
                  {t("copyToken")}
                </Button>
                <Button
                  type="button"
                  className="rounded-full"
                  onClick={() => {
                    void copyQrUrl().then(() => toast.success(t("qrUrlCopied")));
                  }}
                  disabled={!qrUrl}
                >
                  <Copy className="size-4" />
                  {t("copyUrl")}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-border bg-background/45 p-5 text-sm leading-7 text-muted-foreground">
            {t("qrEmpty")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface BillAndCloseCardProps {
  bill: CurrentBill | undefined;
  billError: unknown;
  canAbandon: boolean;
  canSplitBill: boolean;
  closeForm: ReturnType<typeof useForm<CloseSessionFormValues>>;
  hasActiveSession: boolean;
  isClosing: boolean;
  isLoadingBill: boolean;
  isSettled: boolean;
  locale: string;
  onAbandonClick: () => void;
  onSplitBillClick: () => void;
  onSubmit: (values: CloseSessionFormValues) => void;
  t: ReturnType<typeof useTranslations<"FloorConsole">>;
}

function BillAndCloseCard({
  bill,
  billError,
  canAbandon,
  canSplitBill,
  closeForm,
  hasActiveSession,
  isClosing,
  isLoadingBill,
  isSettled,
  locale,
  onAbandonClick,
  onSplitBillClick,
  onSubmit,
  t,
}: BillAndCloseCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Wallet className="size-4" />
        <p className="text-xs font-semibold uppercase tracking-[0.22em]">
          {t("billingEyebrow")}
        </p>
      </div>

      {isLoadingBill ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-16 w-full rounded-[1.25rem]" />
          <Skeleton className="h-16 w-full rounded-[1.25rem]" />
          <Skeleton className="h-16 w-full rounded-[1.25rem]" />
          <Skeleton className="h-16 w-full rounded-[1.25rem]" />
        </div>
      ) : null}

      {!hasActiveSession ? (
        <div className="rounded-[1.5rem] border border-dashed border-border bg-background/45 p-5 text-sm text-muted-foreground">
          {t("billingEmpty")}
        </div>
      ) : null}

      {bill ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <SessionDetailRow label={t("billStatus")} value={bill.status} />
          <SessionDetailRow
            label={t("billRemaining")}
            value={formatMoney(bill.remainingAmount, "CLP")}
          />
          <SessionDetailRow
            label={t("billTotal")}
            value={formatMoney(bill.totalAmount, "CLP")}
          />
          <SessionDetailRow
            label={t("billOpenedAt")}
            value={formatDateTime(locale, bill.openedAt)}
          />
        </div>
      ) : null}

      {billError ? (
        <InlineError
          title={t("billingErrorTitle")}
          description={
            billError instanceof Error
              ? billError.message
              : t("billingErrorDescription")
          }
        />
      ) : null}

      {bill && canSplitBill && Number(bill.remainingAmount) > 0 ? (
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full"
          onClick={onSplitBillClick}
        >
          <Wallet className="size-4" />
          {t("splitAction")}
        </Button>
      ) : null}

      {hasActiveSession ? (
        <form
          onSubmit={closeForm.handleSubmit(onSubmit)}
          className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-background/50 p-4"
        >
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="size-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em]">
              {t("closeEyebrow")}
            </p>
          </div>

          <FieldGroup>
            <FieldLabel htmlFor="close-reason">{t("closeReasonLabel")}</FieldLabel>
            <TextInput
              id="close-reason"
              placeholder={t("closeReasonPlaceholder")}
              disabled={isClosing}
              {...closeForm.register("closeReason")}
            />
            <FieldHint>
              {isSettled ? t("closeHintAllowed") : t("closeHintBlocked")}
            </FieldHint>
          </FieldGroup>

          <Button
            type="submit"
            size="lg"
            className="rounded-full"
            disabled={!bill || !isSettled || isClosing}
          >
            {isClosing ? (
              <>
                <Spinner />
                {t("closeSubmitting")}
              </>
            ) : (
              t("closeSubmit")
            )}
          </Button>

          {canAbandon ? (
            <Button
              type="button"
              variant="ghost"
              className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onAbandonClick}
            >
              <AlertCircle className="size-4" />
              {t("abandonAction")}
            </Button>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

interface TableDetailSheetProps {
  accessToken: string;
  branchId: string;
  table: FloorTable;
  session: { tableSessionId: string; openedAt: string } | undefined;
  sessionSource: TableSessionSource | undefined;
  activeSessionId: string;
  isSessionFetching: boolean;
  isSessionError: boolean;
  sessionError: unknown;
  orders: OrderResponse[];
  isOrdersLoading: boolean;
  canAddOrder: boolean;
  canDeliver: boolean;
  canOpenTable: boolean;
  isOpeningTable: boolean;
  onOpenTable: () => void;
  onDeliverOrder: (orderId: string) => void;
  isDelivering: boolean;
  deliveringOrderId: string | undefined;
  onAddOrderClick: () => void;
  bill: CurrentBill | undefined;
  billError: unknown;
  canAbandon: boolean;
  canSplitBill: boolean;
  isTableAssignmentEnabled: boolean;
  canReassignAnyone: boolean;
  currentUserId: string;
  assignedStaffUserId: string | null;
  assignableStaffOptions: { staffUserId: string; name: string }[];
  isStaffListLoading: boolean;
  isAssigning: boolean;
  onAssign: (staffUserId?: string) => void;
  closeForm: ReturnType<typeof useForm<CloseSessionFormValues>>;
  isClosing: boolean;
  isLoadingBill: boolean;
  isSettled: boolean;
  locale: string;
  onAbandonClick: () => void;
  onSplitBillClick: () => void;
  onCloseSubmit: (values: CloseSessionFormValues) => void;
  onRefresh: () => void;
  onClose: () => void;
  t: ReturnType<typeof useTranslations<"FloorConsole">>;
}

function TableDetailSheet({
  table,
  session,
  sessionSource,
  activeSessionId,
  isSessionFetching,
  isSessionError,
  sessionError,
  orders,
  isOrdersLoading,
  canAddOrder,
  canDeliver,
  canOpenTable,
  isOpeningTable,
  onOpenTable,
  onDeliverOrder,
  isDelivering,
  deliveringOrderId,
  onAddOrderClick,
  bill,
  billError,
  canAbandon,
  canSplitBill,
  isTableAssignmentEnabled,
  canReassignAnyone,
  currentUserId,
  assignedStaffUserId,
  assignableStaffOptions,
  isStaffListLoading,
  isAssigning,
  onAssign,
  closeForm,
  isClosing,
  isLoadingBill,
  isSettled,
  locale,
  onAbandonClick,
  onSplitBillClick,
  onCloseSubmit,
  onRefresh,
  onClose,
  t,
}: TableDetailSheetProps) {
  const hasActiveSession = Boolean(table.currentSession);

  return (
    <BottomSheet onClose={onClose} labelledBy="table-detail-sheet-title">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="size-4" />
        <p className="text-xs font-semibold uppercase tracking-[0.22em]">
          {t("sessionEyebrow")}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge variant="outline">{table.code}</Badge>
        {table.currentSession ? (
          <Badge className={cn("border-0", getSessionStatusTone(table.currentSession.status))}>
            {t(`sessionStatus_${table.currentSession.status}`)}
          </Badge>
        ) : (
          <Badge className={cn("border-0", getTableStatusTone(table.status))}>
            {t(`tableStatus_${table.status}`)}
          </Badge>
        )}
      </div>

      <h2 id="table-detail-sheet-title" className="mt-2 text-2xl font-semibold">
        {table.name}
      </h2>
      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
        <Users className="size-3.5" />
        {t("tableCapacity", { capacity: table.capacity })}
      </p>

      {!hasActiveSession ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">{t("sessionEmpty")}</p>
          <Button
            type="button"
            size="lg"
            className="w-full rounded-full"
            disabled={!canOpenTable || isOpeningTable}
            onClick={onOpenTable}
          >
            {isOpeningTable ? <Spinner /> : <DoorOpen className="size-4" />}
            {isOpeningTable ? t("openSubmitting") : t("openAction")}
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>
              {t(sessionSource === "CASHIER" ? "sourceCashier" : "sourceWaiter")}
            </span>
            <span aria-hidden>·</span>
            <span>
              {t("sessionOpenedAt")}: {formatDateTime(locale, session?.openedAt ?? table.currentSession!.openedAt)}
            </span>
          </div>

          {isTableAssignmentEnabled ? (
            <div className="flex flex-wrap items-center gap-2 rounded-[1.25rem] border border-border/70 bg-background/55 p-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t("assignedLabel")}
              </span>
              {canReassignAnyone ? (
                <SelectInput
                  value={assignedStaffUserId ?? ""}
                  disabled={isAssigning}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value) {
                      onAssign(value);
                    }
                  }}
                  className="h-9 flex-1 basis-40"
                >
                  <option value="" disabled>
                    {t("assignedSelectPlaceholder")}
                  </option>
                  {assignedStaffUserId &&
                  !assignableStaffOptions.some(
                    (option) => option.staffUserId === assignedStaffUserId
                  ) ? (
                    <option value={assignedStaffUserId}>
                      {isStaffListLoading
                        ? t("assignedLoadingOption")
                        : t("assignedStaleOption")}
                    </option>
                  ) : null}
                  {assignableStaffOptions.map((option) => (
                    <option key={option.staffUserId} value={option.staffUserId}>
                      {option.name}
                    </option>
                  ))}
                </SelectInput>
              ) : (
                <>
                  <span className="text-sm font-medium">
                    {assignedStaffUserId === null
                      ? t("assignedUnassigned")
                      : assignedStaffUserId === currentUserId
                        ? t("assignedToMe")
                        : t("assignedToOther")}
                  </span>
                  {assignedStaffUserId !== currentUserId ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="ml-auto rounded-full"
                      disabled={isAssigning}
                      onClick={() => onAssign(undefined)}
                    >
                      {isAssigning ? <Spinner /> : <UserCheck className="size-3.5" />}
                      {t("takeTableAction")}
                    </Button>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="rounded-full" disabled={isSessionFetching} onClick={onRefresh}>
              {isSessionFetching ? <Spinner /> : <RefreshCcw className="size-3.5" />}
              {t("sessionRefresh")}
            </Button>
            {canAddOrder && activeSessionId ? (
              <Button type="button" size="sm" className="rounded-full" onClick={onAddOrderClick}>
                <Plus className="size-3.5" />
                {t("addOrderAction")}
              </Button>
            ) : null}
          </div>

          {isSessionError ? (
            <p className="text-sm text-destructive">
              {sessionError instanceof Error ? sessionError.message : t("sessionError")}
            </p>
          ) : null}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("ordersTitle")}
            </p>

            {isOrdersLoading ? (
              <Skeleton className="h-20 w-full rounded-2xl" />
            ) : null}

            {!isOrdersLoading && orders.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-4 text-center text-sm text-muted-foreground">
                {t("ordersEmpty")}
              </p>
            ) : null}

            <ul className="space-y-3">
              {orders.map((order) => {
                const orderIsReady = order.status === "READY";
                const isDeliveringThis = isDelivering && deliveringOrderId === order.orderId;

                return (
                  <li
                    key={order.orderId}
                    className="rounded-2xl border border-border/70 bg-background/60 p-3.5"
                  >
                    <ul className="space-y-1 text-sm">
                      {order.items.map((item) => (
                        <li key={item.orderItemId} className="flex items-start justify-between gap-2">
                          <span>
                            <span className="font-semibold tabular-nums">{item.quantity}×</span>{" "}
                            {item.name}
                          </span>
                          <Badge variant="secondary" className="shrink-0">
                            {t(`itemStatus_${item.status}`)}
                          </Badge>
                        </li>
                      ))}
                    </ul>

                    {canDeliver && orderIsReady ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full rounded-full"
                        disabled={isDeliveringThis}
                        onClick={() => onDeliverOrder(order.orderId)}
                      >
                        {isDeliveringThis ? <Spinner /> : <CheckCheck className="size-3.5" />}
                        {t("deliverAction")}
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>

          <BillAndCloseCard
            bill={bill}
            billError={billError}
            canAbandon={canAbandon}
            canSplitBill={canSplitBill}
            closeForm={closeForm}
            hasActiveSession={hasActiveSession}
            isClosing={isClosing}
            isLoadingBill={isLoadingBill}
            isSettled={isSettled}
            locale={locale}
            onAbandonClick={onAbandonClick}
            onSplitBillClick={onSplitBillClick}
            onSubmit={onCloseSubmit}
            t={t}
          />
        </div>
      )}
    </BottomSheet>
  );
}
