import { apiRequest } from "@/shared/api/http-client";
import type { MenuDetail } from "@/shared/types/menu";
import type {
  CreateQrOrderRequest,
  OrderResponse,
  PaymentBillSummary,
  PaymentResult,
  PayQrBillRequest,
  PayQrOrderRequest,
} from "@/shared/types/order";

export const qrApi = {
  getMenu(qrToken: string) {
    return apiRequest<MenuDetail>(
      `/qr/tables/${encodeURIComponent(qrToken)}/menu`
    );
  },
  listOrders(qrToken: string) {
    return apiRequest<OrderResponse[]>(
      `/qr/tables/${encodeURIComponent(qrToken)}/orders`
    );
  },
  getBill(qrToken: string) {
    return apiRequest<PaymentBillSummary | null>(
      `/qr/tables/${encodeURIComponent(qrToken)}/bill`
    );
  },
  createOrder(qrToken: string, payload: CreateQrOrderRequest) {
    return apiRequest<OrderResponse>(
      `/qr/tables/${encodeURIComponent(qrToken)}/orders`,
      {
        method: "POST",
        body: payload,
      }
    );
  },
  payOrder(qrToken: string, orderId: string, payload: PayQrOrderRequest = {}) {
    return apiRequest<PaymentResult>(
      `/qr/tables/${encodeURIComponent(qrToken)}/orders/${orderId}/pay`,
      {
        method: "POST",
        body: payload,
      }
    );
  },
  payBill(qrToken: string, payload: PayQrBillRequest) {
    return apiRequest<PaymentResult>(
      `/qr/tables/${encodeURIComponent(qrToken)}/bill/payments`,
      {
        method: "POST",
        body: payload,
      }
    );
  },
};
