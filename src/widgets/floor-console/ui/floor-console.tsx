"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Armchair,
  CheckCircle2,
  Copy,
  CircleDot,
  ClipboardList,
  DoorOpen,
  Plus,
  QrCode,
  RefreshCcw,
  Wallet,
  Sparkles,
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
import { useAdminSessionStore } from "@/features/admin-session/model/admin-session.store";
import { adminApi } from "@/shared/api/admin-api";
import { authApi } from "@/shared/api/auth-api";
import { billingApi } from "@/shared/api/billing-api";
import { floorApi } from "@/shared/api/floor-api";
import { ApiError } from "@/shared/api/http-client";
import {
  getBranchAccessList,
  hasBranchPermission,
  type BranchAccess,
} from "@/shared/lib/branch-access";
import { formatMoney } from "@/shared/lib/format";
import { useClientReady } from "@/shared/lib/use-client-ready";
import type { BranchRole } from "@/shared/types/auth";
import type { BranchOpenBill, CurrentBill } from "@/shared/types/billing";
import type {
  FloorTable,
  TableSessionSource,
  TableSessionStatus,
} from "@/shared/types/floor";
import {
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
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

const FLOOR_READ_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR", "WAITER", "CASHIER"];
const FLOOR_CREATE_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR"];
const FLOOR_MULTI_SOURCE_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR"];
const FLOOR_ORDER_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR", "WAITER", "CASHIER"];
const FLOOR_ABANDON_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR", "CASHIER"];

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

function formatDateTime(locale: string, value: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function isBillSettled(bill: CurrentBill | undefined) {
  return bill ? Number(bill.remainingAmount) <= 0 : false;
}

export function FloorConsole() {
  const t = useTranslations("FloorConsole");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const isClientReady = useClientReady();
  const accessToken = useAdminSessionStore((state) => state.accessToken);
  const storedUser = useAdminSessionStore((state) => state.user);
  const syncUser = useAdminSessionStore((state) => state.syncUser);
  const clearSession = useAdminSessionStore((state) => state.clearSession);

  const {
    data: currentUserData,
    isError: isCurrentUserError,
    error: currentUserError,
  } = useQuery({
    queryKey: ["staff", "me", accessToken],
    enabled: isClientReady && Boolean(accessToken),
    retry: false,
    initialData: storedUser ?? undefined,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    queryFn: async () => {
      try {
        const nextUser = await authApi.getCurrentUser(accessToken!);
        syncUser(nextUser);
        return nextUser;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
        }

        throw error;
      }
    },
  });

  const currentUser = currentUserData ?? storedUser;
  const branchAccessList = useMemo(
    () => (currentUser ? getBranchAccessList(currentUser) : []),
    [currentUser]
  );

  const [rawSelectedBranchId, setSelectedBranchId] = useState<string>("");
  const [rawSelectedSource, setSelectedSource] = useState<TableSessionSource>("WAITER");
  const [rawFocusedTableId, setFocusedTableId] = useState<string>("");
  const [addOrderOpen, setAddOrderOpen] = useState(false);
  const [abandonOpen, setAbandonOpen] = useState(false);
  const [splitBillOpen, setSplitBillOpen] = useState(false);

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
  const canSplitBill = hasBranchPermission(selectedBranch, FLOOR_ORDER_ROLES);

  const { data: branchesData } = useQuery({
    queryKey: ["floor", "branch-settings", accessToken],
    enabled: isClientReady && Boolean(accessToken) && canSplitBill,
    queryFn: () => adminApi.listBranches(accessToken!),
  });
  const isSplitBillEnabled =
    branchesData?.find((branch) => branch.branchId === selectedBranchId)?.settings
      ?.splitBillEnabled ?? false;

  const {
    data: tablesData,
    isLoading: isTablesLoading,
    isError: isTablesError,
    error: tablesError,
  } = useQuery({
    queryKey: ["floor", "tables", accessToken, selectedBranchId],
    enabled:
      isClientReady &&
      Boolean(accessToken) &&
      Boolean(selectedBranchId) &&
      canReadFloor,
    retry: false,
    queryFn: () => floorApi.listTables(accessToken!, selectedBranchId),
  });

  const allTables = useMemo(() => tablesData ?? [], [tablesData]);

  const { data: openBillsData } = useQuery({
    queryKey: ["billing", "open-bills", accessToken, selectedBranchId],
    enabled: isClientReady && Boolean(accessToken) && Boolean(selectedBranchId) && canReadFloor,
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

  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const tables = useMemo(() => {
    if (!showOnlyPending) {
      return allTables;
    }
    return allTables.filter((table) => {
      const bill = openBillsByTableId.get(table.tableId);
      return bill && Number(bill.remainingAmount) > 0;
    });
  }, [allTables, openBillsByTableId, showOnlyPending]);

  const focusedTableId = tables.some((table) => table.tableId === rawFocusedTableId)
    ? rawFocusedTableId
    : tables.find((table) => table.currentSession)?.tableId ?? tables[0]?.tableId ?? "";
  const focusedTable = tables.find((table) => table.tableId === focusedTableId) ?? null;

  const {
    data: currentSessionData,
    isFetching: isCurrentSessionFetching,
    isError: isCurrentSessionError,
    error: currentSessionError,
  } = useQuery({
    queryKey: ["floor", "current-session", accessToken, focusedTableId],
    enabled:
      isClientReady &&
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

  const {
    data: currentBill,
    isLoading: isCurrentBillLoading,
    error: currentBillError,
  } = useQuery({
    queryKey: ["billing", "current-bill", accessToken, activeSessionId],
    enabled:
      isClientReady &&
      Boolean(accessToken) &&
      Boolean(activeSessionId) &&
      canReadFloor,
    retry: false,
    queryFn: () => billingApi.getCurrentBill(accessToken!, activeSessionId),
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
    onSuccess: async (session) => {
      setFocusedTableId(session.tableId);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["floor", "tables"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["floor", "current-session", accessToken, session.tableId],
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
    onSuccess: async (session) => {
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
      setFocusedTableId(session.tableId);
      toast.success(t("closeSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("closeError"));
    },
  });

  const totalTables = tables.length;
  const availableTables = tables.filter((table) => table.status === "AVAILABLE").length;
  const occupiedTables = tables.filter((table) => table.status === "OCCUPIED").length;

  if (!isClientReady) {
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

      {isCurrentUserError ? (
        <InlineError
          title={t("refreshTitle")}
          description={
            currentUserError instanceof Error
              ? currentUserError.message
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
              icon={Armchair}
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

          <section className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
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
                  className="grid gap-4"
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
                    <FieldHint>{t("capacityHint")}</FieldHint>
                  </FieldGroup>

                  <Button
                    type="submit"
                    size="lg"
                    className="mt-2 rounded-full"
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

            <Card className="rounded-[1.9rem] border border-border/70 bg-card/82 shadow-lg shadow-primary/8 backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="size-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.22em]">
                    {t("sessionEyebrow")}
                  </p>
                </div>
                <CardTitle className="text-2xl">{t("sessionTitle")}</CardTitle>
                <CardDescription className="leading-7">
                  {t("sessionDescription")}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {focusedTable && focusedTable.currentSession ? (
                  <div className="space-y-4">
                    <div className="rounded-[1.5rem] border border-primary/12 bg-primary/7 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{focusedTable.code}</Badge>
                        <Badge className={cn("border-0", getSessionStatusTone(focusedTable.currentSession.status))}>
                          {t(`sessionStatus_${focusedTable.currentSession.status}`)}
                        </Badge>
                      </div>
                      <h3 className="mt-3 text-xl font-semibold">{focusedTable.name}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {t("sessionBranch", { branch: selectedBranch?.branchName ?? "" })}
                      </p>
                    </div>

                    <SessionDetailRow
                      label={t("sessionId")}
                      value={
                        currentSessionData?.tableSessionId ??
                        focusedTable.currentSession.tableSessionId
                      }
                    />
                    <SessionDetailRow
                      label={t("sessionSource")}
                      value={t(
                        focusedSessionSource === "CASHIER"
                          ? "sourceCashier"
                          : "sourceWaiter"
                      )}
                    />
                    <SessionDetailRow
                      label={t("sessionOpenedAt")}
                      value={formatDateTime(
                        locale,
                        currentSessionData?.openedAt ?? focusedTable.currentSession.openedAt
                      )}
                    />

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        disabled={isCurrentSessionFetching}
                        onClick={() => {
                          setFocusedTableId(focusedTable.tableId);
                          void queryClient.invalidateQueries({
                            queryKey: ["floor", "current-session", accessToken, focusedTable.tableId],
                          });
                        }}
                      >
                        {isCurrentSessionFetching ? (
                          <Spinner />
                        ) : (
                          <RefreshCcw className="size-4" />
                        )}
                        {t("sessionRefresh")}
                      </Button>

                      {canAddOrder && activeSessionId ? (
                        <Button
                          type="button"
                          className="rounded-full"
                          onClick={() => setAddOrderOpen(true)}
                        >
                          <Plus className="size-4" />
                          {t("addOrderAction")}
                        </Button>
                      ) : null}
                    </div>

                    {isCurrentSessionError ? (
                      <p className="text-sm text-destructive">
                        {currentSessionError instanceof Error
                          ? currentSessionError.message
                          : t("sessionError")}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-border bg-background/45 p-5 text-sm leading-7 text-muted-foreground">
                    {t("sessionEmpty")}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <TableQrCard
              locale={locale}
              t={t}
              table={focusedTable}
            />

            <BillAndCloseCard
              bill={currentBill}
              billError={currentBillError}
              canAbandon={hasBranchPermission(selectedBranch, FLOOR_ABANDON_ROLES)}
              canSplitBill={canSplitBill && isSplitBillEnabled}
              closeForm={closeSessionForm}
              hasActiveSession={Boolean(activeSessionId)}
              isClosing={closeTableMutation.isPending}
              isLoadingBill={isCurrentBillLoading}
              isSettled={isBillSettled(currentBill)}
              locale={locale}
              onAbandonClick={() => setAbandonOpen(true)}
              onSplitBillClick={() => setSplitBillOpen(true)}
              onSubmit={(values) => {
                if (!activeSessionId) {
                  return;
                }

                closeTableMutation.mutate({
                  sessionId: activeSessionId,
                  values,
                });
              }}
              t={t}
            />
          </section>

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
              <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={showOnlyPending}
                  onChange={(event) => setShowOnlyPending(event.target.checked)}
                  className="size-4 cursor-pointer rounded border-border accent-primary"
                />
                {t("tablesFilterPending")}
              </label>
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

              <div className="grid gap-4 lg:grid-cols-2">
                {tables.map((table) => {
                  const canOpenTable =
                    table.status === "AVAILABLE" && availableOpenSources.length > 0;
                  const isFocused = table.tableId === focusedTableId;
                  const isOpeningTable =
                    openTableMutation.isPending &&
                    openTableMutation.variables?.tableId === table.tableId;

                  return (
                    <article
                      key={table.tableId}
                      className={cn(
                        "rounded-[1.6rem] border p-5 transition",
                        isFocused
                          ? "border-primary/35 bg-primary/7 shadow-lg shadow-primary/10"
                          : "border-border/70 bg-background/55"
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{table.code}</Badge>
                            <Badge className={cn("border-0", getTableStatusTone(table.status))}>
                              {t(`tableStatus_${table.status}`)}
                            </Badge>
                          </div>
                          <h3 className="mt-3 text-xl font-semibold">{table.name}</h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {t("tableCapacity", { capacity: table.capacity })}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-card/80 px-3 py-2 text-right text-xs text-muted-foreground">
                          <p>{t("tableQrToken")}</p>
                          <p className="mt-1 font-mono text-foreground">
                            {table.qrToken.slice(0, 8)}
                          </p>
                        </div>
                      </div>

                      {table.currentSession ? (
                        <div className="mt-4 rounded-[1.25rem] border border-border/70 bg-card/72 p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={cn("border-0", getSessionStatusTone(table.currentSession.status))}>
                              {t(`sessionStatus_${table.currentSession.status}`)}
                            </Badge>
                            <Badge variant="secondary">
                              {table.currentSession.openedBySource === "WAITER"
                                ? t("sourceWaiter")
                                : t("sourceCashier")}
                            </Badge>
                            {(() => {
                              const bill = openBillsByTableId.get(table.tableId);
                              const remaining = bill ? Number(bill.remainingAmount) : 0;
                              return remaining > 0 ? (
                                <Badge className="border-0 bg-destructive/10 text-destructive">
                                  {t("tablesBalancePending", {
                                    amount: formatMoney(remaining, "CLP"),
                                  })}
                                </Badge>
                              ) : null;
                            })()}
                          </div>
                          <p className="mt-3 text-sm leading-7 text-muted-foreground">
                            {t("tableOpenedAt", {
                              openedAt: formatDateTime(locale, table.currentSession.openedAt),
                            })}
                          </p>
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => setFocusedTableId(table.tableId)}
                        >
                          <Users className="size-4" />
                          {table.currentSession ? t("focusSession") : t("focusTable")}
                        </Button>

                        {table.currentSession ? (
                          <Button
                            type="button"
                            className="rounded-full"
                            onClick={() => {
                              setFocusedTableId(table.tableId);
                              void queryClient.invalidateQueries({
                                queryKey: [
                                  "floor",
                                  "current-session",
                                  accessToken,
                                  table.tableId,
                                ],
                              });
                            }}
                          >
                            <RefreshCcw className="size-4" />
                            {t("resumeAction")}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            className="rounded-full"
                            disabled={!canOpenTable || isOpeningTable}
                            onClick={() => openTableMutation.mutate(table)}
                          >
                            {isOpeningTable ? (
                              <Spinner />
                            ) : (
                              <DoorOpen className="size-4" />
                            )}
                            {isOpeningTable ? t("openSubmitting") : t("openAction")}
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

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

interface MetricCardProps {
  icon: typeof Armchair;
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
    <Card className="rounded-[1.9rem] border border-border/70 bg-card/82 shadow-lg shadow-primary/8 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <Wallet className="size-4" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em]">
            {t("billingEyebrow")}
          </p>
        </div>
        <CardTitle className="text-2xl">{t("billingTitle")}</CardTitle>
        <CardDescription className="leading-7">
          {t("billingDescription")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
