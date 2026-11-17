export const REPORT_METHOD_KEYS = [
  "CASH",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "TRANSFER",
  "MERCADO_PAGO",
  "VOUCHER",
  "MACH",
  "OTHER",
  "SIN_CLASIFICAR",
] as const;

export type ReportMethodKey = (typeof REPORT_METHOD_KEYS)[number];

export const MANUAL_PAYMENT_METHODS = [
  "CASH",
  "DEBIT_CARD",
  "CREDIT_CARD",
  "TRANSFER",
  "VOUCHER",
  "MACH",
  "OTHER",
] as const;

export type ManualPaymentMethod = (typeof MANUAL_PAYMENT_METHODS)[number];

export interface ReportMethodAmount {
  method: ReportMethodKey;
  amount: string;
}

export interface ReportRangeParams {
  from: string;
  to: string;
  cursor?: string;
  limit?: number;
  filters?: ReportFilters;
  sort?: ReportSort;
}

export interface SalesByOrderRow {
  billId: string;
  closedAt: string;
  orderNumber: string;
  caja: string;
  table: string | null;
  zone: string | null;
  waiter: string | null;
  cashier: string | null;
  guests: number | null;
  paymentStatus: "Pagado" | "Mixto";
  total: string;
  discounts: string;
  payable: string;
  tip: string;
  paymentsCount: number;
  receipt: string | null;
  receiptNumber: string | null;
  refunded: string;
  methods: ReportMethodAmount[];
}

export interface SalesByOrderTotals {
  bills: number;
  paymentsCount: number;
  total: string;
  discounts: string;
  payable: string;
  tip: string;
  refunded: string;
  methods: ReportMethodAmount[];
}

export interface SalesByOrderResponse {
  from: string;
  to: string;
  timeZone: string;
  cashierId: string | null;
  rows: SalesByOrderRow[];
  totals: SalesByOrderTotals;
  nextCursor: string | null;
  limit: number;
}

export interface PaymentsReportRow {
  id: string;
  kind: "PAYMENT" | "ATTEMPT";
  createdAt: string;
  paidAt: string | null;
  billId: string | null;
  orderNumber: string | null;
  table: string | null;
  method: ReportMethodKey | null;
  provider: string;
  providerReference: string | null;
  status: string;
  providerStatus: string | null;
  providerStatusDetail: string | null;
  failureReason: string | null;
  amount: string;
  tip: string;
  total: string;
  cashier: string | null;
  caja: string;
  source: "WEB_QR" | "CASHIER" | "WAITER" | null;
  refunded: string;
}

export interface PaymentsReportResponse {
  from: string;
  to: string;
  timeZone: string;
  cashierId: string | null;
  rows: PaymentsReportRow[];
  totals: {
    byStatus: Array<{ status: string; count: number; amount: string; tip: string }>;
    byMethod: Array<{
      method: ReportMethodKey;
      count: number;
      amount: string;
      tip: string;
    }>;
  };
  nextCursor: string | null;
  limit: number;
}

export const HIERARCHY_GROUP_BYS = ["category", "item", "station"] as const;

export type HierarchyGroupBy = (typeof HIERARCHY_GROUP_BYS)[number];

export interface HierarchyParams extends ReportRangeParams {
  parentId?: string;
  groupBy: HierarchyGroupBy;
  includeModifiers: boolean;
}

export interface HierarchyNode {
  id: string;
  name: string;
  path: string[];
  level: number;
  kind: "category" | "item";
  hasChildren: boolean;
  amount: string;
  quantity: number;
  share: number;
  cancelledQuantity: number;
  averagePrice: string;
}

export interface HierarchyBreadcrumbEntry {
  id: string;
  name: string;
}

export interface SalesByHierarchyResponse {
  from: string;
  to: string;
  timeZone: string;
  parentId: string | null;
  breadcrumb: HierarchyBreadcrumbEntry[];
  groupBy: HierarchyGroupBy;
  includeModifiers: boolean;
  nodes: HierarchyNode[];
  totals: { amount: string; quantity: number };
}

export const REPORT_SOURCES = ["WEB_QR", "CASHIER", "WAITER"] as const;

export type ReportSource = (typeof REPORT_SOURCES)[number];

export const REPORT_BILL_STATUSES = ["PAID_FULL", "MIXED"] as const;

export type ReportBillStatus = (typeof REPORT_BILL_STATUSES)[number];

export type ReportKindKey = "sales-by-order" | "payments" | "sales-by-hierarchy";

export const REPORT_FILTER_KEYS = [
  "cashierId",
  "waiterId",
  "tableId",
  "zoneId",
  "method",
  "source",
  "status",
  "minTotal",
  "maxTotal",
  "hasTip",
  "minTip",
  "timeFrom",
  "timeTo",
  "weekdays",
  "q",
  "productName",
  "categoryPath",
] as const;

export type ReportFilterKey = (typeof REPORT_FILTER_KEYS)[number];

export type ReportFilters = Partial<Record<ReportFilterKey, string>>;

const COMMON_FILTER_KEYS: ReportFilterKey[] = [
  "cashierId",
  "waiterId",
  "tableId",
  "zoneId",
  "method",
  "source",
  "timeFrom",
  "timeTo",
  "weekdays",
];

const LIST_FILTER_KEYS: ReportFilterKey[] = [
  ...COMMON_FILTER_KEYS,
  "minTotal",
  "maxTotal",
  "hasTip",
  "minTip",
  "q",
];

export const REPORT_FILTER_SUPPORT: Record<ReportKindKey, ReportFilterKey[]> = {
  "sales-by-order": [
    ...LIST_FILTER_KEYS,
    "status",
    "productName",
    "categoryPath",
  ],
  payments: LIST_FILTER_KEYS,
  "sales-by-hierarchy": COMMON_FILTER_KEYS,
};

export const REPORT_SORT_FIELDS = ["date", "total", "tip", "order"] as const;

export type ReportSortField = (typeof REPORT_SORT_FIELDS)[number];

export interface ReportSort {
  field: ReportSortField;
  direction: "asc" | "desc";
}

export const DEFAULT_REPORT_SORT: ReportSort = {
  field: "date",
  direction: "desc",
};

export interface ReportFilterOptions {
  windowDays: number;
  since: string;
  staff: Array<{
    id: string;
    name: string | null;
    roles: string[];
    active: boolean;
    hasPayments: boolean;
  }>;
  zones: Array<{ id: string; name: string }>;
  tables: Array<{
    id: string;
    name: string;
    code: string;
    zoneId: string | null;
    isVirtual: boolean;
  }>;
  paymentMethods: Array<{ method: ReportMethodKey; label: string }>;
  providers: string[];
  sources: string[];
  categories: Array<{
    path: string[];
    label: string;
    level: number;
    quantity: number;
  }>;
  products: Array<{
    id: string | null;
    name: string;
    categoryPath: string[];
    categoryLabel: string;
    quantity: number;
  }>;
}

export interface OrderDetailItem {
  id: string;
  orderId: string;
  orderStatus: string;
  name: string;
  productId: string | null;
  categoryPath: string[];
  categoryLabel: string;
  station: string;
  quantity: number;
  unitPrice: string;
  baseUnitPrice: string;
  modifiers: Array<{ name: string; priceDelta: string }>;
  modifiersTotal: string;
  lineTotal: string;
  notes: string | null;
  status: string;
  cancelled: boolean;
  counted: boolean;
}

export interface OrderDetailOrder {
  id: string;
  status: string;
  source: string;
  createdAt: string;
  notes: string | null;
}

export interface OrderDetailPayment {
  id: string;
  method: ReportMethodKey;
  methodLabel: string;
  provider: string;
  providerReference: string | null;
  amount: string;
  tip: string;
  total: string;
  status: string;
  cashier: string | null;
  cashierId: string | null;
  caja: string;
  source: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface OrderDetailResponse {
  billId: string;
  orderNumber: string;
  billStatus: string;
  timeZone: string;
  table: { id: string; name: string };
  zone: { id: string; name: string } | null;
  waiter: { id: string; name: string | null } | null;
  openedBy: string | null;
  cashiers: string[];
  guests: number | null;
  customerLabel: string | null;
  isCounter: boolean;
  openedAt: string;
  closedAt: string | null;
  paidAt: string | null;
  sessionOpenedAt: string;
  sessionClosedAt: string | null;
  closeReason: string | null;
  orders: OrderDetailOrder[];
  items: OrderDetailItem[];
  payments: OrderDetailPayment[];
  totals: {
    itemsCount: number;
    itemsTotal: string;
    excludedItemsTotal: string;
    billTotal: string;
    remaining: string;
    paid: string;
    tip: string;
    collected: string;
    difference: string;
    paidPaymentsCount: number;
    refunded: string;
    reconciled: boolean;
  };
  flags: {
    partiallyPaid: boolean;
    abandoned: boolean;
    voided: boolean;
    overpaid: boolean;
    hasCancelledItems: boolean;
    hasUnclassifiedPayments: boolean;
    hasRefundedPayments: boolean;
    hasOpenPayments: boolean;
    mixedMethods: boolean;
  };
}
