"use client";

import { Suspense, useEffect, useRef } from "react";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
} from "@tanstack/react-query";
import { Download, Receipt, Users, Wallet, HandCoins } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { reportsApi, retryReportRequest } from "@/shared/api/reports-api";
import {
  DEFAULT_REPORT_SORT,
  REPORT_FILTER_SUPPORT,
  type ReportFilters,
  type ReportKindKey,
  type ReportSort,
  type ReportTab,
} from "@/shared/types/reports";
import { formatMoney } from "@/shared/lib/format";
import { getBranchAccessList, hasBranchPermission } from "@/shared/lib/branch-access";
import { SelectInput, TextInput } from "@/shared/ui/form-controls";
import { StatCard } from "@/shared/ui/stat-card";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";
import { downloadBlob } from "./download-blob";
import { ReportFilterBar } from "./filter-bar";
import { DailyZTab } from "./daily-z-tab";
import { HierarchyTab } from "./hierarchy-tab";
import { KpiStrip } from "./kpi-strip";
import { OpenTabsTab } from "./open-tabs-tab";
import { PaymentsTab } from "./payments-tab";
import { RefundsTab } from "./refunds-tab";
import {
  applyPatch,
  effectiveFilters,
  effectiveSort,
  filtersError,
  filtersToParams,
  parseFilters,
  parseSort,
  sortToParams,
  type FilterPatch,
  type SavedView,
} from "./report-filters";
import {
  RANGE_PRESETS,
  isRangePreset,
  resolveRange,
  type RangePreset,
} from "./report-range";
import { SalesByTab } from "./sales-by-tab";
import { SalesTab } from "./sales-tab";
import {
  REFUND_CHIP_PARAMS,
  TAB_LABELS,
  exportTarget,
  parseBucket,
  parseOpenKind,
  parseRefundChips,
  parseSalesByView,
  parseTab,
  tabKind,
  visibleTabs,
  type RefundChips,
} from "./report-tabs";
import { TipsTab } from "./tips-tab";
import { useReportFilterOptions } from "./use-report-filter-options";

const PAGE_SIZE = 50;
const MAX_RANGE_DAYS = 366;
const DAY_MS = 86_400_000;
const REPORT_ROLES = ["ADMIN", "SUPERVISOR", "CASHIER"] as const;
const FULL_ROLES = ["ADMIN", "SUPERVISOR"] as const;

export function ReportsPanel() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ReportsContent />
    </Suspense>
  );
}

function ReportsContent() {
  const t = useTranslations("Reports");
  const session = useAdminSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const branches =
    session.user?.profileType === "staff"
      ? getBranchAccessList(session.user).filter((branch) =>
          hasBranchPermission(branch, [...REPORT_ROLES])
        )
      : [];

  const requestedBranch = searchParams.get("branch");
  const branch =
    branches.find((entry) => entry.branchId === requestedBranch) ?? branches[0] ?? null;
  const branchId = branch?.branchId ?? null;
  const fullAccess = hasBranchPermission(branch, [...FULL_ROLES]);

  const tab: ReportTab = parseTab(searchParams.get("tab"), fullAccess);
  const salesByView = parseSalesByView(searchParams.get("by"), fullAccess);
  const bucket = parseBucket(searchParams.get("bucket"));
  const openKind = parseOpenKind(searchParams.get("openKind"));
  const tabs = visibleTabs(fullAccess);
  const presetParam = searchParams.get("preset");
  const preset: RangePreset =
    fullAccess && isRangePreset(presetParam) ? presetParam : "today";
  const range = resolveRange(preset, {
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });
  const rangeIsOrdered = range.from <= range.to;
  const rangeIsTooLong =
    rangeIsOrdered &&
    (Date.parse(range.to) - Date.parse(range.from)) / DAY_MS + 1 > MAX_RANGE_DAYS;
  const rangeIsValid = rangeIsOrdered && !rangeIsTooLong;

  const filters = parseFilters(searchParams);
  const sort = parseSort(searchParams);
  const refundChips = parseRefundChips((name) => searchParams.get(name));
  const tabView = {
    tab,
    salesBy: salesByView,
    bucket,
    openKind,
    refundChips,
  };
  const kind: ReportKindKey = tabKind(tabView);
  const tabFilters = effectiveFilters(kind, filters, fullAccess);
  const tabSort = effectiveSort(kind, sort);
  const filterCount = Object.keys(tabFilters).length;
  const validationError = filtersError(tabFilters);

  const latestParams = useRef<Record<string, string>>({});

  useEffect(() => {
    latestParams.current = Object.fromEntries(searchParams.entries());
  }, [searchParams]);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const next = { ...latestParams.current };

    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        next[key] = value;
      } else {
        delete next[key];
      }
    }

    latestParams.current = next;
    router.replace({ pathname, query: next }, { scroll: false });
  };

  const currentFilters = () =>
    parseFilters({ get: (name) => latestParams.current[name] ?? null });

  const changeFilters = (patch: FilterPatch) =>
    updateParams(filtersToParams(applyPatch(currentFilters(), patch)));

  const changeSort = (next: ReportSort) => updateParams(sortToParams(next));

  const changeRefundChips = (patch: Partial<RefundChips>) =>
    updateParams(
      Object.fromEntries(
        Object.entries(patch).map(([key, value]) => [
          REFUND_CHIP_PARAMS[key as keyof RefundChips],
          value,
        ])
      )
    );

  const replaceFilters = (next: ReportFilters, nextSort: ReportSort) =>
    updateParams({ ...filtersToParams(next), ...sortToParams(nextSort) });

  const clearChipParams = Object.fromEntries(
    Object.values(REFUND_CHIP_PARAMS).map((param) => [param, ""])
  );

  const clearFilters = () =>
    updateParams({ ...filtersToParams({}), ...clearChipParams });

  const applyView = (view: SavedView) => {
    const supportsAll = (target: ReportKindKey) =>
      Object.keys(view.filters).every((key) =>
        REPORT_FILTER_SUPPORT[target].some((entry) => entry === key)
      );

    updateParams({
      ...filtersToParams(view.filters),
      ...sortToParams(view.sort),
      ...(supportsAll(kind) ? {} : { tab: "sales" }),
    });
  };

  const selectPreset = (nextPreset: RangePreset) =>
    updateParams(
      nextPreset === "custom"
        ? { preset: nextPreset, from: range.from, to: range.to }
        : { preset: nextPreset }
    );

  const selectBranch = (nextBranch: string) =>
    updateParams({
      branch: nextBranch,
      ...filtersToParams({}),
      ...clearChipParams,
    });

  const enabled =
    session.isClientReady &&
    Boolean(session.accessToken) &&
    Boolean(branchId) &&
    rangeIsValid &&
    validationError === null;

  const optionsQuery = useReportFilterOptions(
    session.accessToken ?? null,
    branchId,
    session.isClientReady
  );

  const salesQuery = useInfiniteQuery({
    queryKey: [
      "reports",
      "sales",
      branchId,
      range.from,
      range.to,
      tabFilters,
      tab === "sales" ? tabSort : DEFAULT_REPORT_SORT,
    ],
    enabled: enabled && (tab === "sales" || !fullAccess),
    placeholderData: keepPreviousData,
    retry: retryReportRequest,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      reportsApi.getSalesByOrder(session.accessToken!, branchId!, {
        ...range,
        filters: tabFilters,
        sort: tab === "sales" ? tabSort : DEFAULT_REPORT_SORT,
        cursor: pageParam,
        limit: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const paymentsQuery = useInfiniteQuery({
    queryKey: [
      "reports",
      "payments",
      branchId,
      range.from,
      range.to,
      tabFilters,
      tabSort,
    ],
    enabled: enabled && tab === "payments",
    placeholderData: keepPreviousData,
    retry: retryReportRequest,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      reportsApi.getPayments(session.accessToken!, branchId!, {
        ...range,
        filters: tabFilters,
        sort: tabSort,
        cursor: pageParam,
        limit: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const target = exportTarget(tabView);
      const sorted =
        target.kind === "sales-by-order" ||
        target.kind === "payments" ||
        target.kind === "refunds";
      const blob = await reportsApi.downloadCsv(
        session.accessToken!,
        branchId!,
        target.kind,
        { ...range, filters: tabFilters, sort: sorted ? tabSort : undefined },
        undefined,
        target.extra
      );
      downloadBlob(
        blob,
        `${target.file}_${branchId}_${range.from}_${range.to}.csv`
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("exportError"));
    },
  });

  if (!branch) {
    return null;
  }

  const totals = salesQuery.data?.pages[0]?.totals;
  const billsCount = totals?.bills ?? 0;
  const netSales = Number(totals?.net ?? 0);
  const averageTicket = billsCount > 0 ? Math.round(Math.max(0, netSales) / billsCount) : 0;
  const cardsFailed = salesQuery.isError;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {fullAccess ? t("title") : t("titleCashier")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {fullAccess ? t("description") : t("descriptionCashier")}
        </p>
      </header>

      <div className="sticky top-[4.25rem] z-10 -mx-1 space-y-3 rounded-2xl border border-border/70 bg-background/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-end gap-3">
          {branches.length > 1 ? (
            <div className="w-full sm:w-56">
              <label htmlFor="reports-branch" className="sr-only">
                {t("branch")}
              </label>
              <SelectInput
                id="reports-branch"
                value={branch.branchId}
                onChange={(event) => selectBranch(event.target.value)}
              >
                {branches.map((entry) => (
                  <option key={entry.branchId} value={entry.branchId}>
                    {entry.branchName}
                  </option>
                ))}
              </SelectInput>
            </div>
          ) : null}

          {tab === "dailyZ" ? null : fullAccess ? (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("rangeLabel")}>
              {RANGE_PRESETS.map((entry) => (
                <Button
                  key={entry}
                  size="sm"
                  variant={preset === entry ? "default" : "outline"}
                  className="rounded-full"
                  aria-pressed={preset === entry}
                  onClick={() => selectPreset(entry)}
                >
                  {t(`presets.${entry}`)}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium">{t("presets.today")}</p>
          )}

          {tab !== "dailyZ" && fullAccess && preset === "custom" ? (
            <>
              <div>
                <label htmlFor="reports-from" className="sr-only">
                  {t("from")}
                </label>
                <TextInput
                  id="reports-from"
                  type="date"
                  value={range.from}
                  max={range.to}
                  onChange={(event) => updateParams({ from: event.target.value })}
                />
              </div>
              <div>
                <label htmlFor="reports-to" className="sr-only">
                  {t("to")}
                </label>
                <TextInput
                  id="reports-to"
                  type="date"
                  value={range.to}
                  min={range.from}
                  onChange={(event) => updateParams({ to: event.target.value })}
                />
              </div>
            </>
          ) : null}

          {tab === "dailyZ" ? null : (
          <ReportFilterBar
            key={branch.branchId}
            branchId={branch.branchId}
            kind={kind}
            filters={filters}
            effective={tabFilters}
            sort={tabSort}
            options={optionsQuery.data}
            optionsLoading={optionsQuery.isLoading}
            optionsError={optionsQuery.isError}
            fullAccess={fullAccess}
            validationError={validationError}
            onRetryOptions={() => void optionsQuery.refetch()}
            onChange={changeFilters}
            onSortChange={changeSort}
            onReplace={replaceFilters}
            onApplyView={applyView}
            onClear={clearFilters}
          />
          )}

          {tab === "hierarchy" || tab === "dailyZ" ? null : (
            <Button
              variant="outline"
              className="ml-auto rounded-full"
              disabled={!enabled || exportMutation.isPending}
              onClick={() => exportMutation.mutate()}
            >
              {exportMutation.isPending ? <Spinner /> : <Download />}
              {t("exportCsv")}
            </Button>
          )}
        </div>
      </div>

      {tab === "dailyZ" ? null : fullAccess ? (
        <KpiStrip
          token={session.accessToken ?? null}
          branchId={branch.branchId}
          range={range}
          filters={tabFilters}
          enabled={enabled}
        />
      ) : (
      <section
        aria-label={t("statsAria")}
        aria-busy={salesQuery.isPlaceholderData}
        className={cn(
          "grid grid-cols-2 gap-4 transition-opacity xl:grid-cols-4",
          salesQuery.isPlaceholderData && "opacity-60"
        )}
      >
        <StatCard
          label={t("cardNetSales")}
          value={cardsFailed ? "-" : formatMoney(netSales)}
          icon={<Wallet />}
          isLoading={salesQuery.isLoading}
        />
        <StatCard
          label={t("cardTips")}
          value={cardsFailed ? "-" : formatMoney(totals?.tip ?? 0)}
          icon={<HandCoins />}
          isLoading={salesQuery.isLoading}
        />
        <StatCard
          label={t("cardBills")}
          value={cardsFailed ? "-" : String(billsCount)}
          icon={<Users />}
          isLoading={salesQuery.isLoading}
        />
        <StatCard
          label={t("cardAverageTicket")}
          value={cardsFailed ? "-" : formatMoney(averageTicket)}
          icon={<Receipt />}
          isLoading={salesQuery.isLoading}
        />
      </section>
      )}

      <div
        role="group"
        aria-label={t("tabsLabel")}
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {tabs.map((entry) => (
          <button
            key={entry}
            type="button"
            aria-pressed={tab === entry}
            className={cn(
              "min-h-11 shrink-0 cursor-pointer border-b-2 px-4 text-sm font-medium whitespace-nowrap transition-colors",
              tab === entry
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => updateParams({ tab: entry })}
          >
            {t(TAB_LABELS[entry])}
          </button>
        ))}
      </div>

      {tab === "dailyZ" ? (
        <DailyZTab
          key={branch.branchId}
          token={session.accessToken ?? null}
          branchId={branch.branchId}
          fullAccess={fullAccess}
          enabled={session.isClientReady && Boolean(session.accessToken)}
        />
      ) : !rangeIsValid ? (
        <div role="alert" className="rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {rangeIsOrdered ? t("rangeTooLong") : t("invalidRange")}
        </div>
      ) : tab === "sales" ? (
        <SalesTab
          query={salesQuery}
          token={session.accessToken ?? null}
          branchId={branch.branchId}
          isFiltered={filterCount > 0}
          onClearFilters={clearFilters}
        />
      ) : tab === "salesBy" ? (
        <SalesByTab
          key={branch.branchId}
          token={session.accessToken ?? null}
          branchId={branch.branchId}
          range={range}
          filters={tabFilters}
          enabled={enabled}
          fullAccess={fullAccess}
          view={salesByView}
          bucket={bucket}
          isFiltered={filterCount > 0}
          onClearFilters={clearFilters}
          onViewChange={(next) => updateParams({ by: next })}
          onBucketChange={(next) => updateParams({ bucket: next })}
        />
      ) : tab === "refunds" ? (
        <RefundsTab
          key={branch.branchId}
          token={session.accessToken ?? null}
          branchId={branch.branchId}
          range={range}
          filters={tabFilters}
          sort={tabSort}
          chips={refundChips}
          enabled={enabled}
          isFiltered={filterCount > 0}
          onClearFilters={clearFilters}
          onChipsChange={changeRefundChips}
        />
      ) : tab === "tips" ? (
        <TipsTab
          key={branch.branchId}
          token={session.accessToken ?? null}
          branchId={branch.branchId}
          range={range}
          filters={tabFilters}
          enabled={enabled}
          isFiltered={filterCount > 0}
          onClearFilters={clearFilters}
        />
      ) : tab === "openTabs" ? (
        <OpenTabsTab
          key={branch.branchId}
          token={session.accessToken ?? null}
          branchId={branch.branchId}
          range={range}
          filters={tabFilters}
          enabled={enabled}
          kind={openKind}
          isFiltered={filterCount > 0}
          onClearFilters={clearFilters}
          onKindChange={(next) => updateParams({ openKind: next })}
        />
      ) : tab === "hierarchy" ? (
        <HierarchyTab
          key={branch.branchId}
          accessToken={session.accessToken ?? null}
          branchId={branch.branchId}
          range={range}
          filters={tabFilters}
          enabled={enabled}
          isFiltered={filterCount > 0}
          onClearFilters={clearFilters}
        />
      ) : (
        <PaymentsTab
          query={paymentsQuery}
          token={session.accessToken ?? null}
          branchId={branch.branchId}
          isFiltered={filterCount > 0}
          onClearFilters={clearFilters}
        />
      )}
    </div>
  );
}
