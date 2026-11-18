export const REFUND_REASON_CODES = [
  "CUSTOMER_COMPLAINT",
  "WRONG_ORDER",
  "DISH_UNAVAILABLE",
  "QUALITY_ISSUE",
  "DUPLICATE_CHARGE",
  "CASHIER_ERROR",
  "OTHER",
] as const;

export type RefundReasonCode = (typeof REFUND_REASON_CODES)[number];

export const REFUND_STATUSES = [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "REQUIRES_MANUAL_REVIEW",
] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const REFUND_METHODS = [
  "CASH_MANUAL",
  "GATEWAY",
  "MANUAL_EXTERNAL",
] as const;

export type RefundMethod = (typeof REFUND_METHODS)[number];

export const REFUND_REASON_MIN_LENGTH = 3;
export const REFUND_REASON_MAX_LENGTH = 500;

export interface CreateRefundRequest {
  amount: string;
  reasonCode: RefundReasonCode;
  reasonText: string;
  refundTip: boolean;
  registerAsManual?: boolean;
  approverStaffUserId?: string;
  approverPin?: string;
}

export interface Refundable {
  total: string;
  consumption: string;
  tip: string;
}

export interface RefundRecord {
  refundId: string;
  paymentId: string;
  billId: string;
  amount: string;
  tipAmount: string;
  consumptionAmount: string;
  netAmount: string;
  vatAmount: string;
  status: RefundStatus;
  method: RefundMethod;
  reasonCode: RefundReasonCode;
  reasonText: string;
  failureReason: string | null;
  requestedBy: {
    staffUserId: string;
    name: string;
    role: string | null;
  } | null;
  approvedBy: { staffUserId: string; name: string } | null;
  creditNoteStatus: string;
  completedAt: string | null;
  createdAt: string;
}

export interface RefundPaymentState {
  paymentId: string;
  amount: string;
  tipAmount: string;
  refundedAmount: string;
  refundedTipAmount: string;
  refundable: Refundable;
}

export interface RefundResult {
  refund: RefundRecord;
  payment: RefundPaymentState;
  cashToHandOver: string | null;
  billActiveOrders: number;
  idempotentReplay: boolean;
}

export interface PaymentRefunds {
  payment: RefundPaymentState & {
    billId: string;
    method: string | null;
    provider: string;
    status: string;
    consumptionAmount: string;
    paidAt: string | null;
    disputed: boolean;
    installments: number | null;
    gatewayRefundSupported: boolean;
  };
  settings: {
    cashierRefundLimit: string | null;
    refundTipDefault: boolean;
  };
  eligibility: {
    allowed: boolean;
    method: RefundMethod | null;
    deniedCode: string | null;
    deniedMessage: string | null;
    canManageGateway: boolean;
  };
  refunds: RefundRecord[];
}

export interface RefundApprover {
  staffUserId: string;
  name: string;
}

export interface RefundApprovalRequirement {
  limit: string;
  dayRefunded: string;
  requiredTotal: string;
  approvers: RefundApprover[];
}

export interface RefundsReportRow {
  refundId: string;
  completedAt: string | null;
  billId: string;
  orderNumber: string;
  table: string | null;
  paymentId: string;
  paymentMethod: string;
  provider: string;
  amount: string;
  consumption: string;
  tip: string;
  net: string;
  vat: string;
  refundMethod: RefundMethod;
  status: RefundStatus;
  reasonCode: RefundReasonCode;
  reasonText: string;
  requestedById: string | null;
  requestedBy: string | null;
  requestedByRole: string | null;
  approvedBy: string | null;
  cashier: string | null;
  creditNoteStatus: string;
  creditNoteFolio: string | null;
  billHasActiveOrders: boolean;
}

export interface RefundsReportResponse {
  from: string;
  to: string;
  timeZone: string;
  cashierId: string | null;
  orderBy: "completedAt" | "amount";
  direction: "asc" | "desc";
  rows: RefundsReportRow[];
  totals: {
    count: number;
    amount: string;
    consumption: string;
    tip: string;
    net: string;
    vat: string;
    byMethod: Array<{ method: string; count: number; amount: string }>;
    byReason: Array<{ reasonCode: string; count: number; amount: string }>;
    byRequester: Array<{
      staffUserId: string | null;
      name: string | null;
      count: number;
      amount: string;
    }>;
  };
  nextCursor: string | null;
  limit: number;
}
