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
