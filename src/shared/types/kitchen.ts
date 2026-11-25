import type { OrderItemStatus, OrderSource, StationTicketStatus } from "@/shared/types/order";
import type { PreparationStationType } from "@/shared/types/menu";

export type { StationTicketStatus };

export interface StationTicketItem {
  stationTicketItemId: string;
  orderItemId: string;
  name: string;
  quantity: number;
  status: OrderItemStatus;
  notes: string | null;
  modifiers: string[];
}

export type TicketPrintStatus = "NONE" | "PENDING" | "PRINTED" | "FAILED";

export interface TicketPrint {
  status: TicketPrintStatus;
  lastJobId: string | null;
  printerOffline: boolean;
}

export interface StationTicket {
  stationTicketId: string;
  orderId: string;
  branchId: string;
  preparationStationId: string;
  stationName: string;
  stationType: PreparationStationType;
  status: StationTicketStatus;
  orderSource: OrderSource;
  tableCode: string;
  isCounter: boolean;
  ticketNumber: number | null;
  displayNumber?: string | null;
  print?: TicketPrint;
  customerLabel: string | null;
  orderNotes: string | null;
  sentAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  items: StationTicketItem[];
}

export interface ListStationTicketsParams {
  branchId: string;
  preparationStationId?: string;
  status?: StationTicketStatus;
}

export interface UpdateStationTicketStatusRequest {
  status: StationTicketStatus;
}
