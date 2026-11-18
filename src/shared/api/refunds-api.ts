import { apiRequest } from "@/shared/api/http-client";
import type {
  CreateRefundItemsRequest,
  CreateRefundRequest,
  PaymentRefunds,
  RefundItemSelection,
  RefundItemsPreview,
  RefundResult,
  RefundableBillItem,
} from "@/shared/types/refunds";

export const refundsApi = {
  listItems(token: string, branchId: string, billId: string) {
    return apiRequest<{ billId: string; items: RefundableBillItem[] }>(
      `/branches/${branchId}/bills/${billId}/refunds/items`,
      { token }
    );
  },
  previewItems(
    token: string,
    branchId: string,
    billId: string,
    payload: {
      paymentId: string;
      items: RefundItemSelection[];
      refundTip: boolean;
    }
  ) {
    return apiRequest<RefundItemsPreview>(
      `/branches/${branchId}/bills/${billId}/refunds/items/preview`,
      { method: "POST", token, body: payload }
    );
  },
  createItems(
    token: string,
    branchId: string,
    billId: string,
    idempotencyKey: string,
    payload: CreateRefundItemsRequest
  ) {
    return apiRequest<RefundResult>(
      `/branches/${branchId}/bills/${billId}/refunds/items`,
      {
        method: "POST",
        token,
        body: payload,
        headers: { "Idempotency-Key": idempotencyKey },
      }
    );
  },
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
