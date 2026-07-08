import { apiRequest } from "@/shared/api/http-client";
import type { CreateWaiterOrderRequest, OrderResponse } from "@/shared/types/order";

export const ordersApi = {
  createWaiterOrder(token: string, payload: CreateWaiterOrderRequest) {
    return apiRequest<OrderResponse>("/orders", {
      method: "POST",
      token,
      body: payload,
    });
  },
  listSessionOrders(token: string, tableSessionId: string) {
    return apiRequest<OrderResponse[]>(
      `/orders?tableSessionId=${encodeURIComponent(tableSessionId)}`,
      {
        token,
      }
    );
  },
};
