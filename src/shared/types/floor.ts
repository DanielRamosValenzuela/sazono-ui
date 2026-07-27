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
  guestCount: number | null;
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
  zoneId: string | null;
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
  guestCount: number;
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
  guestCount: number | null;
}

export interface TableZone {
  zoneId: string;
  branchId: string;
  name: string;
  tableIds: string[];
  staffUserIds: string[];
}

export interface CreateTableZoneRequest {
  branchId: string;
  name: string;
}

export interface RenameTableZoneRequest {
  name: string;
}

export interface SetTableZoneRequest {
  zoneId: string | null;
}

export interface SetZoneStaffRequest {
  staffUserIds: string[];
}

export interface BranchStaffMember {
  staffUserId: string;
  firstName: string;
  lastName: string;
}
