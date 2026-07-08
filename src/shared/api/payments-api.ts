import { apiRequest } from "@/shared/api/http-client";
import type { BillSplit, CreateBillSplitRequest } from "@/shared/types/billing";

export const paymentsApi = {
  createBillSplit(token: string, billId: string, payload: CreateBillSplitRequest) {
    return apiRequest<BillSplit>(`/payments/bills/${billId}/splits`, {
      method: "POST",
      token,
      body: payload,
    });
  },
  getCurrentBillSplit(token: string, billId: string) {
    return apiRequest<BillSplit | null>(`/payments/bills/${billId}/splits/current`, {
      token,
    });
  },
};
