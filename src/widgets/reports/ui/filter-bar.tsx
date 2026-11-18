"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { ListFilter, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney } from "@/shared/lib/format";
import {
  REPORT_FILTER_SUPPORT,
  type ReportFilterOptions,
  type ReportFilters,
  type ReportKindKey,
  type ReportSort,
} from "@/shared/types/reports";
import { FilterFields } from "./filter-fields";
import {
  applyPatch,
  splitList,
  toggleListValue,
  type FilterPatch,
  type SavedView,
} from "./report-filters";
import { SavedViewsMenu } from "./saved-views-menu";

type FilterBarProps = {
  branchId: string;
  kind: ReportKindKey;
  filters: ReportFilters;
  effective: ReportFilters;
  sort: ReportSort;
  options: ReportFilterOptions | undefined;
  optionsLoading: boolean;
  optionsError: boolean;
  fullAccess: boolean;
  validationError: string | null;
  onRetryOptions: () => void;
  onChange: (patch: FilterPatch) => void;
  onSortChange: (sort: ReportSort) => void;
  onReplace: (filters: ReportFilters, sort: ReportSort) => void;
  onApplyView: (view: SavedView) => void;
  onClear: () => void;
};

type Chip = { id: string; label: string; patch: FilterPatch };

const DESKTOP_QUERY = "(min-width: 768px)";
const DESKTOP_DEBOUNCE_MS = 400;

function subscribeDesktop(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onChange);

  return () => media.removeEventListener("change", onChange);
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false
  );
}

export function ReportFilterBar({
  branchId,
  kind,
  filters,
  effective,
  sort,
  options,
  optionsLoading,
  optionsError,
  fullAccess,
  validationError,
  onRetryOptions,
  onChange,
  onSortChange,
  onReplace,
  onApplyView,
  onClear,
}: FilterBarProps) {
  const t = useTranslations("Reports");
  const panelId = useId();
  const isDesktop = useIsDesktop();
  const [panelOpen, setPanelOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<{ filters: ReportFilters; sort: ReportSort }>({
    filters,
    sort,
  });

  const supported = REPORT_FILTER_SUPPORT[kind];
  const count = Object.keys(effective).length;
  const sortIsDefault = sort.field === "date" && sort.direction === "desc";
  const expanded = isDesktop ? panelOpen : sheetOpen;

  const staffName = (id: string) => {
    const staff = options?.staff.find((entry) => entry.id === id);

    return staff?.name ?? id.slice(0, 8);
  };

  const chips: Chip[] = [];

  if (effective.cashierId) {
    chips.push({
      id: "cashierId",
      label: t("filters.chipCashier", { name: staffName(effective.cashierId) }),
      patch: { cashierId: "" },
    });
  }

  if (effective.waiterId) {
    chips.push({
      id: "waiterId",
      label: t("filters.chipWaiter", { name: staffName(effective.waiterId) }),
      patch: { waiterId: "" },
    });
  }

  if (effective.zoneId) {
    chips.push({
      id: "zoneId",
      label: t("filters.chipZone", {
        name:
          options?.zones.find((zone) => zone.id === effective.zoneId)?.name ??
          effective.zoneId.slice(0, 8),
      }),
      patch: { zoneId: "" },
    });
  }

  if (effective.tableId) {
    chips.push({
      id: "tableId",
      label: t("filters.chipTable", {
        name:
          options?.tables.find((table) => table.id === effective.tableId)?.name ??
          effective.tableId.slice(0, 8),
      }),
      patch: { tableId: "" },
    });
  }

  for (const value of splitList(effective.method)) {
    chips.push({
      id: `method-${value}`,
      label: t("filters.chipMethod", { name: t(`methods.${value}`) }),
      patch: toggleListValue(effective, "method", value),
    });
  }

  for (const value of splitList(effective.source)) {
    chips.push({
      id: `source-${value}`,
      label: t("filters.chipSource", { name: t(`sources.${value}`) }),
      patch: toggleListValue(effective, "source", value),
    });
  }

  for (const value of splitList(effective.status)) {
    chips.push({
      id: `status-${value}`,
      label: t("filters.chipStatus", { name: t(`filters.statusValues.${value}`) }),
      patch: toggleListValue(effective, "status", value),
    });
  }

  if (effective.minTotal || effective.maxTotal) {
    const min = formatMoney(effective.minTotal ?? 0);
    const max = formatMoney(effective.maxTotal ?? 0);
    chips.push({
      id: "total",
      label:
        effective.minTotal && effective.maxTotal
          ? t("filters.chipTotalBetween", { min, max })
          : effective.minTotal
            ? t("filters.chipTotalFrom", { value: min })
            : t("filters.chipTotalTo", { value: max }),
      patch: { minTotal: "", maxTotal: "" },
    });
  }

  if (effective.hasTip) {
    chips.push({
      id: "hasTip",
      label: t(effective.hasTip === "true" ? "filters.tipWith" : "filters.tipWithout"),
      patch: { hasTip: "" },
    });
  }

  if (effective.minTip) {
    chips.push({
      id: "minTip",
      label: t("filters.chipTipMin", { value: formatMoney(effective.minTip) }),
      patch: { minTip: "" },
    });
  }

  if (effective.timeFrom || effective.timeTo) {
    chips.push({
      id: "time",
      label:
        effective.timeFrom && effective.timeTo
          ? t("filters.chipTimeBetween", {
              from: effective.timeFrom,
              to: effective.timeTo,
            })
          : effective.timeFrom
            ? t("filters.chipTimeFrom", { value: effective.timeFrom })
            : t("filters.chipTimeTo", { value: effective.timeTo ?? "" }),
      patch: { timeFrom: "", timeTo: "" },
    });
  }

  if (effective.weekdays) {
    chips.push({
      id: "weekdays",
      label: t("filters.chipWeekdays", {
        days: splitList(effective.weekdays)
          .map((day) => t(`filters.weekdayShort.${day}`))
          .join(" "),
      }),
      patch: { weekdays: "" },
    });
  }

  if (effective.q) {
    chips.push({
      id: "q",
      label: t("filters.chipSearch", { value: effective.q }),
      patch: { q: "" },
    });
  }

  if (effective.productName) {
    chips.push({
      id: "productName",
      label: t("filters.chipProduct", { name: effective.productName }),
      patch: { productName: "" },
    });
  }

  if (effective.categoryPath) {
    chips.push({
      id: "categoryPath",
      label: t("filters.chipCategory", { name: effective.categoryPath }),
      patch: { categoryPath: "" },
    });
  }

  const toggle = () => {
    if (isDesktop) {
      setPanelOpen((open) => !open);
      return;
    }

    setDraft({ filters, sort });
    setSheetOpen(true);
  };

  const optionsNotice = optionsError ? (
    <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-destructive">
      <span>{t("filters.optionsError")}</span>
      <Button size="sm" variant="outline" className="rounded-full" onClick={onRetryOptions}>
        {t("retry")}
      </Button>
    </div>
  ) : optionsLoading ? (
    <p className="text-xs text-muted-foreground" aria-live="polite">
      {t("filters.optionsLoading")}
    </p>
  ) : null;

  return (
    <div className="contents">
      <Button
        variant={count > 0 ? "secondary" : "outline"}
        className="h-10 rounded-full sm:h-9"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={toggle}
      >
        <ListFilter />
        {t("filters.title")}
        {count > 0 ? (
          <Badge
            aria-label={t("filters.activeCount", { count })}
            className="h-5 min-w-5 justify-center rounded-full px-1.5 tabular-nums"
          >
            {count}
          </Badge>
        ) : null}
      </Button>

      <SavedViewsMenu
        branchId={branchId}
        filters={effective}
        sort={sort}
        canSave={count > 0 || !sortIsDefault}
        onApply={onApplyView}
      />

      {count > 0 || (isDesktop && panelOpen) || validationError ? (
        <div className="order-last w-full space-y-3">
          {count > 0 ? (
            <ul className="flex flex-wrap items-center gap-1.5" aria-label={t("filters.activeLabel")}>
              {chips.map((chip) => (
                <li key={chip.id}>
                  <button
                    type="button"
                    className="inline-flex min-h-8 max-w-full cursor-pointer items-center gap-1.5 rounded-full border border-border bg-muted px-3 text-xs font-medium hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                    aria-label={t("filters.removeChip", { label: chip.label })}
                    onClick={() => onChange(chip.patch)}
                  >
                    <span className="truncate">{chip.label}</span>
                    <X className="size-3.5 shrink-0" aria-hidden="true" />
                  </button>
                </li>
              ))}
              <li>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={onClear}
                >
                  {t("filters.clearAll")}
                </Button>
              </li>
            </ul>
          ) : null}

          {validationError ? (
            <p role="alert" className="text-sm text-destructive">
              {t(`filters.${validationError}`)}
            </p>
          ) : null}

          {isDesktop && panelOpen ? (
            <section
              id={panelId}
              aria-label={t("filters.title")}
              className="max-h-[55vh] space-y-3 overflow-y-auto rounded-2xl border border-border/70 bg-card p-4"
            >
              <FilterFields
                idPrefix="reports-filter"
                kind={kind}
                filters={filters}
                sort={sort}
                options={options}
                supported={supported}
                fullAccess={fullAccess}
                debounceMs={DESKTOP_DEBOUNCE_MS}
                onChange={onChange}
                onSortChange={onSortChange}
              />
              {optionsNotice}
            </section>
          ) : null}
        </div>
      ) : null}

      <Dialog open={sheetOpen && !isDesktop} onOpenChange={setSheetOpen}>
        <DialogContent
          id={panelId}
          className="top-auto bottom-0 left-0 flex max-h-[90dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-t-3xl rounded-b-none p-0"
        >
          <DialogHeader className="border-b border-border px-4 py-4 pr-12">
            <DialogTitle>{t("filters.title")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("filters.sheetDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <FilterFields
              idPrefix="reports-filter-sheet"
              kind={kind}
              filters={draft.filters}
              sort={draft.sort}
              options={options}
              supported={supported}
              fullAccess={fullAccess}
              debounceMs={0}
              onChange={(patch) =>
                setDraft((current) => ({
                  ...current,
                  filters: applyPatch(current.filters, patch),
                }))
              }
              onSortChange={(next) =>
                setDraft((current) => ({ ...current, sort: next }))
              }
            />
            {optionsNotice}
          </div>
          <div className="flex gap-2 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-full"
              onClick={() =>
                setDraft((current) => ({ ...current, filters: {} }))
              }
            >
              {t("filters.clearAll")}
            </Button>
            <Button
              className="h-11 flex-1 rounded-full"
              onClick={() => {
                onReplace(draft.filters, draft.sort);
                setSheetOpen(false);
              }}
            >
              {t("filters.apply")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
