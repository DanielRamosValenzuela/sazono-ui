export type BillStatus = "OPEN" | "PAID";

export interface CurrentBill {
  billId: string;
  tableSessionId: string;
  branchId: string;
  status: BillStatus;
  subtotalAmount: string;
  taxAmount: string;
  tipAmount: string;
  totalAmount: string;
  remainingAmount: string;
  openedAt: string;
  closedAt: string | null;
  closeReason: string | null;
}

export type BillSplitMode = "BY_AMOUNT";

export type BillSplitStatus = "OPEN" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";

export type BillSplitParticipantStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "FAILED"
  | "CANCELLED";

export interface BillSplitParticipant {
  participantId: string;
  participantToken: string;
  displayName: string | null;
  allocatedAmount: string;
  paidAmount: string;
  status: BillSplitParticipantStatus;
}

export interface BillSplit {
  billSplitId: string;
  billId: string;
  splitMode: BillSplitMode;
  status: BillSplitStatus;
  participants: BillSplitParticipant[];
}

export interface CreateBillSplitParticipantRequest {
  displayName?: string;
  amount: string;
}

export interface CreateBillSplitRequest {
  participants: CreateBillSplitParticipantRequest[];
}

export interface BillSplitParticipantDetail {
  participantId: string;
  displayName: string | null;
  allocatedAmount: string;
  paidAmount: string;
  status: BillSplitParticipantStatus;
  currency: string;
  billStatus: string;
}

export interface PayBillSplitParticipantRequest {
  tipAmount?: string;
}

export interface BranchOpenBill {
  tableId: string;
  tableCode: string;
  tableName: string;
  tableSessionId: string;
  sessionStatus: string;
  sessionOpenedAt: string;
  billId: string;
  totalAmount: string;
  remainingAmount: string;
}
