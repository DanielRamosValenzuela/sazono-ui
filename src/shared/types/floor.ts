export type FloorTableStatus = "AVAILABLE" | "OCCUPIED" | "DISABLED";

export type TableSessionStatus = "OPEN" | "PAYMENT_COMPLETED" | "CLOSED";

export type TableSessionSource = "WAITER" | "CASHIER";

export interface CurrentTableSessionSummary {
  tableSessionId: string;
  status: TableSessionStatus;
  openedBySource: TableSessionSource;
  openedAt: string;
}

export interface FloorTable {
  tableId: string;
  branchId: string;
  code: string;
  name: string;
  capacity: number;
  status: FloorTableStatus;
  qrToken: string;
  currentSession: CurrentTableSessionSummary | null;
}

export interface CreateFloorTableRequest {
  branchId: string;
  code: string;
  name: string;
  capacity: number;
}

export interface OpenTableSessionRequest {
  tableId: string;
  openedBySource: TableSessionSource;
}

export interface TableSessionDetail {
  tableSessionId: string;
  tableId: string;
  branchId: string;
  status: TableSessionStatus;
  openedBySource: TableSessionSource;
  openedAt: string;
  closeReason: string | null;
  closedAt: string | null;
}
