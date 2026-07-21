export type FloorTableStatus = "AVAILABLE" | "OCCUPIED" | "DISABLED";

export type TableSessionStatus =
  | "OPEN"
  | "PAYMENT_COMPLETED"
  | "CLOSED"
  | "ABANDONED";

export type TableSessionSource = "WAITER" | "CASHIER";

export interface CurrentTableSessionSummary {
  tableSessionId: string;
  status: TableSessionStatus;
  openedBySource: TableSessionSource;
  openedAt: string;
  assignedStaffUserId: string | null;
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

export interface CloseTableSessionRequest {
  closeReason: string;
}

export interface AbandonTableSessionRequest {
  closeReason: string;
}

export interface AssignTableSessionRequest {
  staffUserId?: string;
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
  assignedStaffUserId: string | null;
}
