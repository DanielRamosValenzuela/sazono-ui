import { apiRequest } from "@/shared/api/http-client";
import type {
  CreateRefundRequest,
  PaymentRefunds,
  RefundResult,
} from "@/shared/types/refunds";

export const refundsApi = {
  listForPayment(token: string, branchId: string, paymentId: string) {
    return apiRequest<PaymentRefunds>(
      `/branches/${branchId}/payments/${paymentId}/refunds`,
      { token }
    );
  },
  retry(token: string, refundId: string) {
    return apiRequest<RefundResult>(`/refunds/${refundId}/retry`, {
      method: "POST",
      token,
    });
  },
  markManual(token: string, refundId: string) {
    return apiRequest<RefundResult>(`/refunds/${refundId}/mark-manual`, {
      method: "POST",
      token,
    });
  },
  create(
    token: string,
    branchId: string,
    paymentId: string,
    idempotencyKey: string,
    payload: CreateRefundRequest
  ) {
    return apiRequest<RefundResult>(
      `/branches/${branchId}/payments/${paymentId}/refunds`,
      {
        method: "POST",
        token,
        body: payload,
        headers: { "Idempotency-Key": idempotencyKey },
      }
    );
  },
};
