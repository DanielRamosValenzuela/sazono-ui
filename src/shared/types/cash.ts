export type CashSessionStatus = "OPEN" | "CLOSED";

export type CashMovementType =
  "CASH_IN" | "CASH_OUT" | "REFUND_OUT" | "TIP_PAYOUT" | "ADJUSTMENT";

export interface CashSession {
  id: string;
  branchId: string;
  registerLabel: string;
  status: CashSessionStatus;
  cashierStaffUserId: string;
  cashierName: string | null;
  openedAt: string;
  closedAt: string | null;
  closedByName: string | null;
  forced: boolean;
  openingFloat: string;
  cashSalesAmount: string;
  cashInAmount: string;
  cashOutAmount: string;
  refundOutAmount: string;
  otherMovementsAmount: string;
  movementsAmount: string;
  expectedCash: string;
  countedCash: string | null;
  difference: string | null;
  closingNote: string | null;
}

export interface CashMovement {
  id: string;
  type: CashMovementType;
  amount: string;
  reason: string;
  cashSessionId: string | null;
  staffUserId: string;
  staffName: string | null;
  createdAt: string;
}

export interface CashCloseWarnings {
  openBills: number;
  partialBillsCollectedInSession: number;
}

export interface CashCloseResult {
  session: CashSession;
  warnings: CashCloseWarnings;
}

export interface CloseCashSessionRequest {
  countedCash: string;
  closingNote?: string;
  denominations?: Record<string, number>;
}

export interface CreateCashMovementRequest {
  type: "CASH_IN" | "CASH_OUT";
  amount: string;
  reason: string;
}
