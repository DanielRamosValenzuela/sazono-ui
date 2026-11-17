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
