import { apiRequest } from "@/shared/api/http-client";
import type {
  BranchReadySummaryItem,
  CreateWaiterOrderRequest,
  OrderResponse,
} from "@/shared/types/order";

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
  deliverOrder(token: string, orderId: string) {
    return apiRequest<OrderResponse>(`/orders/${orderId}/deliver`, {
      method: "POST",
      token,
    });
  },
  listBranchReadySummary(token: string, branchId: string) {
    return apiRequest<BranchReadySummaryItem[]>(
      `/orders/branch-ready-summary?branchId=${encodeURIComponent(branchId)}`,
      {
        token,
      }
    );
  },
};
