export const DISCOUNT_TYPES = ["PERCENT", "AMOUNT"] as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const DISCOUNT_REASONS = [
  "COURTESY",
  "CUSTOMER_COMPLAINT",
  "STAFF_MEAL",
  "PROMOTION",
  "LOYALTY",
  "PRICE_ERROR",
  "OTHER",
] as const;

export type DiscountReason = (typeof DISCOUNT_REASONS)[number];

export const DISCOUNT_REASON_MIN_LENGTH = 3;
export const DISCOUNT_REASON_MAX_LENGTH = 500;

export interface CreateDiscountRequest {
  billItemId?: string;
  type: DiscountType;
  value: string;
  reasonCode: DiscountReason;
  reasonText: string;
  approverStaffUserId?: string;
  approverPin?: string;
}

export interface DiscountBillTotals {
  billId: string;
  status: string;
  subtotalAmount: string;
  discountAmount: string;
  consumptionAmount: string;
  tipAmount: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
}

export interface BillDiscount {
  id: string;
  billId: string;
  billItemId: string | null;
  billItemDescription: string | null;
  type: DiscountType;
  value: string;
  amount: string;
  reasonCode: DiscountReason;
  reasonText: string;
  appliedByStaffUserId: string;
  appliedByName: string;
  appliedByRole: string;
  approvedByStaffUserId: string | null;
  approvedByName: string | null;
  voidedAt: string | null;
  voidedByStaffUserId: string | null;
  voidedByName: string | null;
  voidReason: string | null;
  createdAt: string;
}

export interface DiscountBillItem {
  billItemId: string;
  description: string;
  quantity: number;
  totalPrice: string;
  discountAmount: string;
}

export interface BillDiscountList {
  bill: DiscountBillTotals;
  items: DiscountBillItem[];
  discounts: BillDiscount[];
  needsApprovalAbovePercent: string | null;
  needsApprovalAboveAmount: string | null;
}

export interface DiscountApprover {
  staffUserId: string;
  name: string;
}

export interface DiscountPreview {
  bill: DiscountBillTotals;
  newDiscountAmount: string;
  needsApproval: boolean;
  maxDiscount: string;
  approvers: DiscountApprover[];
}

export interface DiscountResult {
  discount: BillDiscount;
  bill: DiscountBillTotals;
  splitCancelled: boolean;
  idempotentReplay: boolean;
}

export interface VoidDiscountResult {
  discount: BillDiscount;
  bill: DiscountBillTotals;
  splitCancelled: boolean;
}
