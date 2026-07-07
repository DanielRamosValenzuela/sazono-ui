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
