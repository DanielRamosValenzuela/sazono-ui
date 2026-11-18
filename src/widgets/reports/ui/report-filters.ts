import {
  DEFAULT_REPORT_SORT,
  REPORT_BILL_STATUSES,
  REPORT_FILTER_KEYS,
  REPORT_FILTER_SUPPORT,
  REPORT_METHOD_KEYS,
  REPORT_SORT_FIELDS,
  REPORT_SOURCES,
  type ReportFilterKey,
  type ReportFilters,
  type ReportKindKey,
  type ReportSort,
  type ReportSortField,
} from "@/shared/types/reports";

export type FilterPatch = Partial<Record<ReportFilterKey, string>>;

type ParamReader = { get: (name: string) => string | null };

export const WEEKDAY_VALUES = ["1", "2", "3", "4", "5", "6", "7"] as const;
export const MAX_AMOUNT = 1_000_000_000;
export const SEARCH_MAX_LENGTH = 100;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const INTEGER_PATTERN = /^\d{1,10}$/;
const MAX_CATEGORY_DEPTH = 4;
const MAX_SAVED_VIEWS = 20;

export function splitList(value: string | undefined): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

function parseEnumList(raw: string | null, allowed: readonly string[]) {
  const values = splitList(raw ?? undefined);

  return allowed.filter((value) => values.includes(value)).join(",");
}

function parseUuid(raw: string | null) {
  return raw && UUID_PATTERN.test(raw) ? raw : "";
}

function parseTime(raw: string | null) {
  return raw && TIME_PATTERN.test(raw) ? raw : "";
}

function parseAmount(raw: string | null) {
  if (!raw || !INTEGER_PATTERN.test(raw) || Number(raw) > MAX_AMOUNT) {
    return "";
  }

  return String(Number(raw));
}

function parseText(raw: string | null, maxLength: number) {
  return (raw ?? "").trim().slice(0, maxLength);
}

function parseCategory(raw: string | null) {
  const text = parseText(raw, 900);
  const segments = text.split(">").map((segment) => segment.trim());

  if (
    !text ||
    segments.length > MAX_CATEGORY_DEPTH ||
    segments.some((segment) => !segment || segment.length > 200)
  ) {
    return "";
  }

  return segments.join(" > ");
}

function clean(filters: Record<ReportFilterKey, string>): ReportFilters {
  const result: ReportFilters = {};

  for (const key of REPORT_FILTER_KEYS) {
    if (filters[key]) {
      result[key] = filters[key];
    }
  }

  return result;
}

export function parseFilters(params: ParamReader): ReportFilters {
  const hasTip = params.get("hasTip");

  return clean({
    cashierId: parseUuid(params.get("cashierId")),
    waiterId: parseUuid(params.get("waiterId")),
    tableId: parseUuid(params.get("tableId")),
    zoneId: parseUuid(params.get("zoneId")),
    method: parseEnumList(params.get("method"), REPORT_METHOD_KEYS),
    source: parseEnumList(params.get("source"), REPORT_SOURCES),
    status: parseEnumList(params.get("status"), REPORT_BILL_STATUSES),
    minTotal: parseAmount(params.get("minTotal")),
    maxTotal: parseAmount(params.get("maxTotal")),
    hasTip: hasTip === "true" || hasTip === "false" ? hasTip : "",
    minTip: parseAmount(params.get("minTip")),
    timeFrom: parseTime(params.get("timeFrom")),
    timeTo: parseTime(params.get("timeTo")),
    weekdays: parseEnumList(params.get("weekdays"), WEEKDAY_VALUES),
    q: parseText(params.get("q"), SEARCH_MAX_LENGTH),
    productName: parseText(params.get("productName"), 200),
    categoryPath: parseCategory(params.get("categoryPath")),
  });
}

export function parseSort(params: ParamReader): ReportSort {
  const field = params.get("sort");

  return {
    field: REPORT_SORT_FIELDS.includes(field as ReportSortField)
      ? (field as ReportSortField)
      : DEFAULT_REPORT_SORT.field,
    direction: params.get("dir") === "asc" ? "asc" : "desc",
  };
}

export function sortToParams(sort: ReportSort): Record<string, string> {
  return {
    sort: sort.field === DEFAULT_REPORT_SORT.field ? "" : sort.field,
    dir: sort.direction === DEFAULT_REPORT_SORT.direction ? "" : sort.direction,
  };
}

export function effectiveSort(kind: ReportKindKey, sort: ReportSort): ReportSort {
  if (kind !== "sales-by-order" && kind !== "payments" && kind !== "refunds") {
    return DEFAULT_REPORT_SORT;
  }

  if (kind === "payments" && sort.field === "order") {
    return { ...sort, field: "date" };
  }

  return kind === "refunds" && (sort.field === "order" || sort.field === "tip")
    ? { ...sort, field: "date" }
    : sort;
}

export function effectiveFilters(
  kind: ReportKindKey,
  filters: ReportFilters,
  fullAccess: boolean
): ReportFilters {
  const result: ReportFilters = {};

  for (const key of REPORT_FILTER_SUPPORT[kind]) {
    if (filters[key] && (fullAccess || key !== "cashierId")) {
      result[key] = filters[key];
    }
  }

  if (result.hasTip === "false") {
    delete result.minTip;
  }

  return result;
}

export function filtersError(filters: ReportFilters): "amountRange" | null {
  const min = filters.minTotal ? Number(filters.minTotal) : null;
  const max = filters.maxTotal ? Number(filters.maxTotal) : null;

  return min !== null && max !== null && min > max ? "amountRange" : null;
}

export function applyPatch(filters: ReportFilters, patch: FilterPatch): ReportFilters {
  const merged = { ...filters, ...patch } as Record<ReportFilterKey, string>;

  if (patch.hasTip === "false") {
    merged.minTip = "";
  }

  return clean(merged);
}

export function filtersToParams(filters: ReportFilters): Record<string, string> {
  const params: Record<string, string> = {};

  for (const key of REPORT_FILTER_KEYS) {
    params[key] = filters[key] ?? "";
  }

  return params;
}

export function toggleListValue(
  filters: ReportFilters,
  key: "method" | "source" | "status" | "weekdays",
  value: string
): FilterPatch {
  const current = splitList(filters[key]);
  const next = current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value];
  const order: readonly string[] =
    key === "method"
      ? REPORT_METHOD_KEYS
      : key === "source"
        ? REPORT_SOURCES
        : key === "status"
          ? REPORT_BILL_STATUSES
          : WEEKDAY_VALUES;

  return { [key]: order.filter((entry) => next.includes(entry)).join(",") };
}

export type SavedView = {
  id: string;
  name: string;
  filters: ReportFilters;
  sort: ReportSort;
};

export const BUILT_IN_VIEWS: Array<SavedView & { labelKey: "withTip" | "mixed" }> = [
  {
    id: "builtin-with-tip",
    name: "",
    labelKey: "withTip",
    filters: { hasTip: "true" },
    sort: DEFAULT_REPORT_SORT,
  },
  {
    id: "builtin-mixed",
    name: "",
    labelKey: "mixed",
    filters: { status: "MIXED" },
    sort: DEFAULT_REPORT_SORT,
  },
];

function storageKey(branchId: string) {
  return `sazono.reports.views.${branchId}`;
}

function toSavedView(entry: unknown): SavedView | null {
  if (typeof entry !== "object" || entry === null) {
    return null;
  }

  const { id, name, filters, sort } = entry as Record<string, unknown>;

  if (typeof id !== "string" || typeof name !== "string") {
    return null;
  }

  const filterSource = (typeof filters === "object" && filters !== null ? filters : {}) as Record<string, unknown>;
  const sortSource = (typeof sort === "object" && sort !== null ? sort : {}) as Record<string, unknown>;
  const read = (source: Record<string, unknown>, key: string) =>
    typeof source[key] === "string" ? (source[key] as string) : null;

  return {
    id,
    name,
    filters: parseFilters({ get: (key) => read(filterSource, key) }),
    sort: parseSort({
      get: (key) => read(sortSource, key === "sort" ? "field" : "direction"),
    }),
  };
}

export function loadSavedViews(branchId: string): SavedView[] {
  try {
    const raw = window.localStorage.getItem(storageKey(branchId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(toSavedView)
      .filter((view): view is SavedView => view !== null)
      .slice(0, MAX_SAVED_VIEWS);
  } catch {
    return [];
  }
}

export function persistSavedViews(branchId: string, views: SavedView[]) {
  try {
    window.localStorage.setItem(
      storageKey(branchId),
      JSON.stringify(views.slice(0, MAX_SAVED_VIEWS))
    );
  } catch {
    return;
  }
}
