import {
  OPEN_TAB_KINDS,
  SALES_BY_VIEWS,
  TIME_BUCKETS,
  type OpenTabKind,
  type ReportKindKey,
  type ReportTab,
  type SalesByView,
  type TimeBucket,
} from "@/shared/types/reports";
import {
  REFUND_METHODS,
  REFUND_REASON_CODES,
  REFUND_STATUSES,
} from "@/shared/types/refunds";
import { CASHIER_SALES_BY_VIEWS } from "./sales-by-tab";

const FULL_TABS: ReportTab[] = [
  "sales",
  "payments",
  "refunds",
  "salesBy",
  "tips",
  "openTabs",
  "hierarchy",
  "dailyZ",
];

const CASHIER_TABS: ReportTab[] = [
  "sales",
  "payments",
  "refunds",
  "salesBy",
  "tips",
  "dailyZ",
];

export const TAB_LABELS: Record<ReportTab, string> = {
  sales: "tabSales",
  payments: "tabPayments",
  refunds: "tabRefunds",
  hierarchy: "tabHierarchy",
  salesBy: "tabSalesBy",
  tips: "tabTips",
  openTabs: "tabOpenTabs",
  dailyZ: "tabDailyZ",
};

export function visibleTabs(fullAccess: boolean): ReportTab[] {
  return fullAccess ? FULL_TABS : CASHIER_TABS;
}

export function parseTab(raw: string | null, fullAccess: boolean): ReportTab {
  return visibleTabs(fullAccess).find((tab) => tab === raw) ?? "sales";
}

export function parseSalesByView(
  raw: string | null,
  fullAccess: boolean
): SalesByView {
  return (
    SALES_BY_VIEWS.find(
      (view) =>
        view === raw && (fullAccess || CASHIER_SALES_BY_VIEWS.includes(view))
    ) ?? "method"
  );
}

export function parseBucket(raw: string | null): TimeBucket {
  return TIME_BUCKETS.find((bucket) => bucket === raw) ?? "hour";
}

export function parseOpenKind(raw: string | null): OpenTabKind {
  return OPEN_TAB_KINDS.find((kind) => kind === raw) ?? "open";
}

const SALES_BY_KINDS: Record<SalesByView, ReportKindKey> = {
  method: "sales-by-method",
  waiter: "sales-by-staff",
  cashier: "sales-by-staff",
  time: "sales-by-time",
};

const SALES_BY_FILES: Record<SalesByView, string> = {
  method: "ventas-por-medio",
  waiter: "ventas-por-mesero",
  cashier: "ventas-por-cajero",
  time: "ventas-por-tiempo",
};

const OPEN_TAB_FILES: Record<OpenTabKind, string> = {
  open: "cuentas-abiertas",
  abandoned: "cuentas-abandonadas",
  cancelled: "cuentas-anuladas",
};

export type RefundChips = {
  reasonCode: string;
  refundStatus: string;
  refundMethod: string;
};

export const REFUND_CHIP_PARAMS = {
  reasonCode: "refReason",
  refundStatus: "refStatus",
  refundMethod: "refMethod",
} as const satisfies Record<keyof RefundChips, string>;

const REFUND_CHIP_VALUES: Record<keyof RefundChips, readonly string[]> = {
  reasonCode: REFUND_REASON_CODES,
  refundStatus: REFUND_STATUSES,
  refundMethod: REFUND_METHODS,
};

export function parseRefundChips(
  read: (name: string) => string | null
): RefundChips {
  const parse = (key: keyof RefundChips) => {
    const selected = (read(REFUND_CHIP_PARAMS[key]) ?? "").split(",");

    return REFUND_CHIP_VALUES[key]
      .filter((value) => selected.includes(value))
      .join(",");
  };

  return {
    reasonCode: parse("reasonCode"),
    refundStatus: parse("refundStatus"),
    refundMethod: parse("refundMethod"),
  };
}

export function refundChipExtra(
  chips: RefundChips
): Record<string, string | undefined> {
  return {
    reasonCode: chips.reasonCode || undefined,
    refundStatus: chips.refundStatus || undefined,
    refundMethod: chips.refundMethod || undefined,
  };
}

export type TabView = {
  tab: ReportTab;
  refundChips: RefundChips;
  salesBy: SalesByView;
  bucket: TimeBucket;
  openKind: OpenTabKind;
};

export function tabKind({ tab, salesBy }: TabView): ReportKindKey {
  switch (tab) {
    case "payments":
      return "payments";
    case "refunds":
      return "refunds";
    case "hierarchy":
      return "sales-by-hierarchy";
    case "salesBy":
      return SALES_BY_KINDS[salesBy];
    case "tips":
      return "tips";
    case "openTabs":
      return "open-tabs";
    default:
      return "sales-by-order";
  }
}

export type ExportTarget = {
  kind: ReportKindKey;
  extra: Record<string, string | undefined>;
  file: string;
};

export function exportTarget(view: TabView): ExportTarget {
  const kind = tabKind(view);

  switch (view.tab) {
    case "payments":
      return { kind, extra: {}, file: "pagos" };
    case "refunds":
      return { kind, extra: refundChipExtra(view.refundChips), file: "reembolsos" };
    case "salesBy":
      return {
        kind,
        extra:
          view.salesBy === "time"
            ? { bucket: view.bucket }
            : kind === "sales-by-staff"
              ? { role: view.salesBy }
              : {},
        file: SALES_BY_FILES[view.salesBy],
      };
    case "tips":
      return { kind, extra: {}, file: "propinas" };
    case "openTabs":
      return {
        kind,
        extra: { kind: view.openKind },
        file: OPEN_TAB_FILES[view.openKind],
      };
    default:
      return { kind, extra: {}, file: "cierre-ventas" };
  }
}
