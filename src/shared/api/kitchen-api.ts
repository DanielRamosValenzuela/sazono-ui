import { apiRequest } from "@/shared/api/http-client";
import type {
  ListStationTicketsParams,
  StationTicket,
  UpdateStationTicketStatusRequest,
} from "@/shared/types/kitchen";

export const kitchenApi = {
  listStationTickets(token: string, params: ListStationTicketsParams) {
    const query = new URLSearchParams({ branchId: params.branchId });

    if (params.preparationStationId) {
      query.set("preparationStationId", params.preparationStationId);
    }

    if (params.status) {
      query.set("status", params.status);
    }

    return apiRequest<StationTicket[]>(`/kitchen/station-tickets?${query.toString()}`, {
      token,
    });
  },
  updateStationTicketStatus(
    token: string,
    stationTicketId: string,
    payload: UpdateStationTicketStatusRequest
  ) {
    return apiRequest<StationTicket>(
      `/kitchen/station-tickets/${stationTicketId}/status`,
      {
        method: "POST",
        token,
        body: payload,
      }
    );
  },
};
