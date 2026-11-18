import { apiRequest } from "@/shared/api/http-client";
import type {
  BillDiscountList,
  CreateDiscountRequest,
  DiscountPreview,
  DiscountResult,
  VoidDiscountResult,
} from "@/shared/types/discounts";

const base = (branchId: string, billId: string) =>
  `/branches/${branchId}/bills/${billId}/discounts`;

export const discountsApi = {
  list(token: string, branchId: string, billId: string) {
    return apiRequest<BillDiscountList>(base(branchId, billId), { token });
  },
  preview(
    token: string,
    branchId: string,
    billId: string,
    payload: CreateDiscountRequest
  ) {
    return apiRequest<DiscountPreview>(`${base(branchId, billId)}/preview`, {
      method: "POST",
      token,
      body: payload,
    });
  },
  create(
    token: string,
    branchId: string,
    billId: string,
    idempotencyKey: string,
    payload: CreateDiscountRequest
  ) {
    return apiRequest<DiscountResult>(base(branchId, billId), {
      method: "POST",
      token,
      body: payload,
      headers: { "Idempotency-Key": idempotencyKey },
    });
  },
  void(
    token: string,
    branchId: string,
    billId: string,
    discountId: string,
    reasonText: string
  ) {
    return apiRequest<VoidDiscountResult>(
      `${base(branchId, billId)}/${discountId}/void`,
      { method: "POST", token, body: { reasonText } }
    );
  },
};
