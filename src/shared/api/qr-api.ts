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
  QrOrderPaymentStatusResponse,
} from "@/shared/types/order";
import type {
  QrPaymentConfigResponse,
  RedirectPaymentResponse,
  StartRedirectBillPaymentRequest,
  StartRedirectOrderPaymentRequest,
} from "@/shared/types/payments";

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
  getPaymentConfig(qrToken: string) {
    return apiRequest<QrPaymentConfigResponse>(
      `/qr/tables/${encodeURIComponent(qrToken)}/payment-config`
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
  payOrder(
    qrToken: string,
    orderId: string,
    payload: PayQrOrderRequest = {},
    signal?: AbortSignal
  ) {
    return apiRequest<PaymentResult>(
      `/qr/tables/${encodeURIComponent(qrToken)}/orders/${orderId}/pay`,
      {
        method: "POST",
        body: payload,
        signal,
      }
    );
  },
  getOrderPaymentStatus(qrToken: string, orderId: string) {
    return apiRequest<QrOrderPaymentStatusResponse>(
      `/qr/tables/${encodeURIComponent(qrToken)}/orders/${encodeURIComponent(
        orderId
      )}/payment-status`
    );
  },
  payBill(qrToken: string, payload: PayQrBillRequest, signal?: AbortSignal) {
    return apiRequest<PaymentResult>(
      `/qr/tables/${encodeURIComponent(qrToken)}/bill/payments`,
      {
        method: "POST",
        body: payload,
        signal,
      }
    );
  },
  startOrderRedirectPayment(
    qrToken: string,
    orderId: string,
    payload: StartRedirectOrderPaymentRequest
  ) {
    return apiRequest<RedirectPaymentResponse>(
      `/qr/tables/${encodeURIComponent(qrToken)}/orders/${orderId}/pay/redirect`,
      {
        method: "POST",
        body: payload,
      }
    );
  },
  startBillRedirectPayment(
    qrToken: string,
    payload: StartRedirectBillPaymentRequest
  ) {
    return apiRequest<RedirectPaymentResponse>(
      `/qr/tables/${encodeURIComponent(qrToken)}/bill/payments/redirect`,
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
  startSplitParticipantRedirectPayment(
    participantToken: string,
    payload: StartRedirectOrderPaymentRequest
  ) {
    return apiRequest<RedirectPaymentResponse>(
      `/qr/split-participants/${encodeURIComponent(participantToken)}/pay/redirect`,
      {
        method: "POST",
        body: payload,
      }
    );
  },
  payBillSplitParticipant(
    participantToken: string,
    payload: PayBillSplitParticipantRequest = {},
    signal?: AbortSignal
  ) {
    return apiRequest<PaymentResult>(
      `/qr/split-participants/${encodeURIComponent(participantToken)}/pay`,
      {
        method: "POST",
        body: payload,
        signal,
      }
    );
  },
};
