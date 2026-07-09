import { apiRequest } from "@/shared/api/http-client";
import type {
  BillSplitParticipantDetail,
  PayBillSplitParticipantRequest,
} from "@/shared/types/billing";
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
  getMenu(qrToken: string, locale?: string) {
    const query = locale ? `?locale=${encodeURIComponent(locale)}` : "";
    return apiRequest<MenuDetail>(
      `/qr/tables/${encodeURIComponent(qrToken)}/menu${query}`
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
  getBillSplitParticipant(participantToken: string) {
    return apiRequest<BillSplitParticipantDetail>(
      `/qr/split-participants/${encodeURIComponent(participantToken)}`
    );
  },
  payBillSplitParticipant(
    participantToken: string,
    payload: PayBillSplitParticipantRequest = {}
  ) {
    return apiRequest<PaymentResult>(
      `/qr/split-participants/${encodeURIComponent(participantToken)}/pay`,
      {
        method: "POST",
        body: payload,
      }
    );
  },
};
