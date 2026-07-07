import type { BillStatus } from "@/shared/types/billing";
import type {
  PreparationStationSummary,
  PreparationStationType,
} from "@/shared/types/menu";

export type OrderStatus =
  | "DRAFT"
  | "AWAITING_PAYMENT"
  | "PAYMENT_FAILED"
  | "CONFIRMED"
  | "ROUTED"
  | "IN_PREPARATION"
  | "PARTIALLY_READY"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

export type OrderItemStatus =
  | "PENDING"
  | "IN_PREPARATION"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

export type OrderSource = "QR" | "WAITER" | "MIXED";

export type PaymentPolicy = "PREPAID" | "POSTPAID";

export type StationTicketStatus =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "READY"
  | "CANCELLED";

export type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export interface OrderItemResponse {
  orderItemId: string;
  menuItemId: string | null;
  name: string;
  unitPrice: string;
  quantity: number;
  totalPrice: string;
  status: OrderItemStatus;
  notes: string | null;
  preparationStation: PreparationStationSummary;
}

export interface OrderStationTicketSummary {
  stationTicketId: string;
  preparationStationId: string;
  stationName: string;
  stationType: PreparationStationType;
  status: StationTicketStatus;
  sentAt: string | null;
}

export interface OrderResponse {
  orderId: string;
  tableSessionId: string;
  billId: string;
  branchId: string;
  source: OrderSource;
  paymentPolicy: PaymentPolicy;
  status: OrderStatus;
  notes: string | null;
  submittedAt: string | null;
  createdAt: string;
  orderTotalAmount: string;
  items: OrderItemResponse[];
  stationTickets: OrderStationTicketSummary[];
}

export interface CreateOrderItemRequest {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export interface CreateQrOrderRequest {
  items: CreateOrderItemRequest[];
  notes?: string;
}

export interface PayQrOrderRequest {
  tipAmount?: string;
}

export interface PayQrBillRequest {
  amount: string;
  tipAmount?: string;
}

export interface PaymentBillSummary {
  billId: string;
  status: BillStatus;
  subtotalAmount: string;
  tipAmount: string;
  totalAmount: string;
  remainingAmount: string;
}

export interface PaidOrderSummary {
  orderId: string;
  status: OrderStatus;
}

export interface PaymentResult {
  paymentId: string;
  billId: string;
  amount: string;
  currency: string;
  provider: string;
  providerReference: string | null;
  status: PaymentStatus;
  paidAt: string | null;
  bill: PaymentBillSummary;
  order: PaidOrderSummary | null;
}
