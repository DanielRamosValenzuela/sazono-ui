"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FieldLabel, SelectInput, TextInput } from "@/shared/ui/form-controls";
import {
  REPORT_BILL_STATUSES,
  REPORT_METHOD_KEYS,
  REPORT_SORT_FIELDS,
  REPORT_SOURCES,
  type ReportFilterKey,
  type ReportFilterOptions,
  type ReportFilters,
  type ReportKindKey,
  type ReportMethodKey,
  type ReportSort,
  type ReportSortField,
} from "@/shared/types/reports";
import {
  SEARCH_MAX_LENGTH,
  WEEKDAY_VALUES,
  splitList,
  toggleListValue,
  type FilterPatch,
} from "./report-filters";
import { SearchSelect, type SearchSelectOption } from "./search-select";

type FilterFieldsProps = {
  idPrefix: string;
  kind: ReportKindKey;
  filters: ReportFilters;
  sort: ReportSort;
  options: ReportFilterOptions | undefined;
  supported: ReportFilterKey[];
  fullAccess: boolean;
  debounceMs: number;
  onChange: (patch: FilterPatch) => void;
  onSortChange: (sort: ReportSort) => void;
};

type DebouncedInputProps = Omit<ComponentProps<"input">, "value" | "onChange"> & {
  value: string;
  delay: number;
  digitsOnly?: boolean;
  onCommit: (value: string) => void;
};

function DebouncedInput({
  value,
  delay,
  digitsOnly = false,
  onCommit,
  ...props
}: DebouncedInputProps) {
  const [local, setLocal] = useState(value);
  const [seen, setSeen] = useState(value);
  const [committed, setCommitted] = useState(value);
  const timer = useRef<number | undefined>(undefined);

  if (value !== seen) {
    setSeen(value);
    setCommitted(value);

    if (value !== committed) {
      setLocal(value);
    }
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const commit = (next: string) => {
    setCommitted(next);
    onCommit(next);
  };

  return (
    <TextInput
      {...props}
      value={local}
      onChange={(event) => {
        const next = digitsOnly
          ? event.target.value.replace(/\D/g, "").slice(0, 10)
          : event.target.value;
        setLocal(next);
        window.clearTimeout(timer.current);

        if (delay <= 0) {
          commit(next);
        } else {
          timer.current = window.setTimeout(() => commit(next), delay);
        }
      }}
    />
  );
}

function Field({
  htmlFor,
  label,
  className,
  children,
}: {
  htmlFor?: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      {htmlFor ? (
        <FieldLabel htmlFor={htmlFor} className="text-xs text-muted-foreground">
          {label}
        </FieldLabel>
      ) : (
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      )}
      {children}
    </div>
  );
}

function ToggleChip({
  pressed,
  label,
  title,
  className,
  onClick,
}: {
  pressed: boolean;
  label: string;
  title?: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={pressed ? "default" : "outline"}
      className={cn("min-h-9 rounded-full", className)}
      aria-pressed={pressed}
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function withSelected(
  options: SearchSelectOption[],
  selected: string | undefined
): SearchSelectOption[] {
  return selected && !options.some((option) => option.value === selected)
    ? [{ value: selected, label: selected }, ...options]
    : options;
}

export function FilterFields({
  idPrefix,
  kind,
  filters,
  sort,
  options,
  supported,
  fullAccess,
  debounceMs,
  onChange,
  onSortChange,
}: FilterFieldsProps) {
  const t = useTranslations("Reports");
  const has = (key: ReportFilterKey) => supported.includes(key);
  const fieldId = (name: string) => `${idPrefix}-${name}`;
  const showSort = kind !== "sales-by-hierarchy";
  const sortFields = REPORT_SORT_FIELDS.filter(
    (field) => field !== "order" || kind === "sales-by-order"
  );
  const hasTip = filters.hasTip ?? "";

  const staffOptions: SearchSelectOption[] = (options?.staff ?? []).map(
    (staff) => ({
      value: staff.id,
      label: staff.name ?? staff.id.slice(0, 8),
      hint: staff.active ? undefined : t("filters.inactive"),
    })
  );
  const staffSelect = (key: "cashierId" | "waiterId", label: string) => (
    <Field htmlFor={fieldId(key)} label={label}>
      <SelectInput
        id={fieldId(key)}
        value={filters[key] ?? ""}
        onChange={(event) => onChange({ [key]: event.target.value })}
      >
        <option value="">{t("filters.all")}</option>
        {withSelected(staffOptions, filters[key]).map((option) => (
          <option key={option.value} value={option.value}>
            {option.hint ? `${option.label} (${option.hint})` : option.label}
          </option>
        ))}
      </SelectInput>
    </Field>
  );

  const tables = (options?.tables ?? []).filter(
    (table) => !filters.zoneId || table.zoneId === filters.zoneId
  );
  const methodKeys: ReportMethodKey[] = REPORT_METHOD_KEYS.filter(
    (key) =>
      !options ||
      options.paymentMethods.some((entry) => entry.method === key) ||
      splitList(filters.method).includes(key)
  );
  const productOptions: SearchSelectOption[] = [
    ...new Map(
      (options?.products ?? []).map((product) => [
        product.name,
        {
          value: product.name,
          label: product.name,
          hint: product.categoryLabel,
        },
      ])
    ).values(),
  ];
  const categoryOptions: SearchSelectOption[] = (options?.categories ?? []).map(
    (category) => ({ value: category.label, label: category.label })
  );

  return (
    <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {has("q") ? (
        <Field
          htmlFor={fieldId("q")}
          label={t("filters.search")}
          className="sm:col-span-2 lg:col-span-3"
        >
          <DebouncedInput
            id={fieldId("q")}
            type="search"
            delay={debounceMs}
            maxLength={SEARCH_MAX_LENGTH}
            placeholder={t("filters.searchPlaceholder")}
            value={filters.q ?? ""}
            onCommit={(value) => onChange({ q: value.trim() })}
          />
        </Field>
      ) : null}

      {has("cashierId") && fullAccess
        ? staffSelect("cashierId", t("filters.cashier"))
        : null}
      {has("waiterId") && fullAccess
        ? staffSelect("waiterId", t("filters.waiter"))
        : null}

      {has("zoneId") ? (
        <Field htmlFor={fieldId("zoneId")} label={t("filters.zone")}>
          <SelectInput
            id={fieldId("zoneId")}
            value={filters.zoneId ?? ""}
            onChange={(event) => {
              const zoneId = event.target.value;
              const table = options?.tables.find(
                (entry) => entry.id === filters.tableId
              );
              onChange({
                zoneId,
                ...(zoneId && table && table.zoneId !== zoneId
                  ? { tableId: "" }
                  : {}),
              });
            }}
          >
            <option value="">{t("filters.allFeminine")}</option>
            {withSelected(
              (options?.zones ?? []).map((zone) => ({
                value: zone.id,
                label: zone.name,
              })),
              filters.zoneId
            ).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </Field>
      ) : null}

      {has("tableId") ? (
        <Field htmlFor={fieldId("tableId")} label={t("filters.table")}>
          <SelectInput
            id={fieldId("tableId")}
            value={filters.tableId ?? ""}
            onChange={(event) => onChange({ tableId: event.target.value })}
          >
            <option value="">{t("filters.allFeminine")}</option>
            {withSelected(
              tables.map((table) => ({ value: table.id, label: table.name })),
              filters.tableId
            ).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </Field>
      ) : null}

      {has("method") ? (
        <Field
          label={t("filters.method")}
          className="sm:col-span-2 lg:col-span-3"
        >
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label={t("filters.method")}
          >
            {methodKeys.map((key) => (
              <ToggleChip
                key={key}
                label={t(`methods.${key}`)}
                pressed={splitList(filters.method).includes(key)}
                onClick={() => onChange(toggleListValue(filters, "method", key))}
              />
            ))}
          </div>
        </Field>
      ) : null}

      {has("source") ? (
        <Field label={t("filters.source")}>
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label={t("filters.source")}
          >
            {REPORT_SOURCES.map((key) => (
              <ToggleChip
                key={key}
                label={t(`sources.${key}`)}
                pressed={splitList(filters.source).includes(key)}
                onClick={() => onChange(toggleListValue(filters, "source", key))}
              />
            ))}
          </div>
        </Field>
      ) : null}

      {has("status") ? (
        <Field label={t("filters.status")}>
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label={t("filters.status")}
          >
            {REPORT_BILL_STATUSES.map((key) => (
              <ToggleChip
                key={key}
                label={t(`filters.statusValues.${key}`)}
                pressed={splitList(filters.status).includes(key)}
                onClick={() => onChange(toggleListValue(filters, "status", key))}
              />
            ))}
          </div>
        </Field>
      ) : null}

      {has("hasTip") ? (
        <Field label={t("filters.tip")}>
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label={t("filters.tip")}
          >
            {(
              [
                ["", "filters.tipAny"],
                ["true", "filters.tipWith"],
                ["false", "filters.tipWithout"],
              ] as const
            ).map(([value, label]) => (
              <ToggleChip
                key={value || "any"}
                label={t(label)}
                pressed={hasTip === value}
                onClick={() => onChange({ hasTip: value })}
              />
            ))}
          </div>
        </Field>
      ) : null}

      {has("minTip") ? (
        <Field htmlFor={fieldId("minTip")} label={t("filters.minTip")}>
          <DebouncedInput
            id={fieldId("minTip")}
            inputMode="numeric"
            digitsOnly
            delay={debounceMs}
            disabled={hasTip === "false"}
            placeholder="0"
            value={hasTip === "false" ? "" : (filters.minTip ?? "")}
            onCommit={(value) => onChange({ minTip: value })}
          />
        </Field>
      ) : null}

      {has("minTotal") ? (
        <Field label={t("filters.totalRange")}>
          <div className="grid grid-cols-2 gap-2">
            <DebouncedInput
              aria-label={t("filters.min")}
              inputMode="numeric"
              digitsOnly
              delay={debounceMs}
              placeholder={t("filters.min")}
              value={filters.minTotal ?? ""}
              onCommit={(value) => onChange({ minTotal: value })}
            />
            <DebouncedInput
              aria-label={t("filters.max")}
              inputMode="numeric"
              digitsOnly
              delay={debounceMs}
              placeholder={t("filters.max")}
              value={filters.maxTotal ?? ""}
              onCommit={(value) => onChange({ maxTotal: value })}
            />
          </div>
        </Field>
      ) : null}

      {has("timeFrom") ? (
        <Field label={t("filters.timeRange")}>
          <div className="grid grid-cols-2 gap-2">
            <TextInput
              type="time"
              aria-label={t("filters.timeFrom")}
              value={filters.timeFrom ?? ""}
              onChange={(event) => onChange({ timeFrom: event.target.value })}
            />
            <TextInput
              type="time"
              aria-label={t("filters.timeTo")}
              value={filters.timeTo ?? ""}
              onChange={(event) => onChange({ timeTo: event.target.value })}
            />
          </div>
        </Field>
      ) : null}

      {has("weekdays") ? (
        <Field
          label={t("filters.weekdays")}
          className="sm:col-span-2 lg:col-span-3"
        >
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label={t("filters.weekdays")}
          >
            {WEEKDAY_VALUES.map((day) => (
              <ToggleChip
                key={day}
                className="min-w-11"
                label={t(`filters.weekdayShort.${day}`)}
                title={t(`filters.weekdayLong.${day}`)}
                pressed={splitList(filters.weekdays).includes(day)}
                onClick={() => onChange(toggleListValue(filters, "weekdays", day))}
              />
            ))}
          </div>
        </Field>
      ) : null}

      {has("productName") ? (
        <Field htmlFor={fieldId("productName")} label={t("filters.product")}>
          <SearchSelect
            id={fieldId("productName")}
            value={filters.productName ?? ""}
            options={productOptions}
            placeholder={t("filters.productPlaceholder")}
            emptyText={t("filters.noMatches")}
            clearLabel={t("filters.clearSelection")}
            onChange={(value) => onChange({ productName: value })}
          />
        </Field>
      ) : null}

      {has("categoryPath") ? (
        <Field htmlFor={fieldId("categoryPath")} label={t("filters.category")}>
          <SearchSelect
            id={fieldId("categoryPath")}
            value={filters.categoryPath ?? ""}
            options={categoryOptions}
            placeholder={t("filters.categoryPlaceholder")}
            emptyText={t("filters.noMatches")}
            clearLabel={t("filters.clearSelection")}
            onChange={(value) => onChange({ categoryPath: value })}
          />
        </Field>
      ) : null}

      {showSort ? (
        <Field htmlFor={fieldId("sort")} label={t("filters.sort")}>
          <div className="flex gap-2">
            <SelectInput
              id={fieldId("sort")}
              value={sort.field}
              onChange={(event) =>
                onSortChange({
                  ...sort,
                  field: event.target.value as ReportSortField,
                })
              }
            >
              {sortFields.map((field) => (
                <option key={field} value={field}>
                  {t(`filters.sortFields.${field}`)}
                </option>
              ))}
            </SelectInput>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0 rounded-xl"
              aria-label={t(
                sort.direction === "asc" ? "filters.asc" : "filters.desc"
              )}
              title={t(sort.direction === "asc" ? "filters.asc" : "filters.desc")}
              onClick={() =>
                onSortChange({
                  ...sort,
                  direction: sort.direction === "asc" ? "desc" : "asc",
                })
              }
            >
              {sort.direction === "asc" ? (
                <ArrowUpNarrowWide />
              ) : (
                <ArrowDownWideNarrow />
              )}
            </Button>
          </div>
        </Field>
      ) : null}
    </div>
  );
}
