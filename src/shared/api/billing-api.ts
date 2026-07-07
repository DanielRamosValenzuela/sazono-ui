import { apiRequest } from "@/shared/api/http-client";
import type { CurrentBill } from "@/shared/types/billing";

export const billingApi = {
  getCurrentBill(token: string, tableSessionId: string) {
    return apiRequest<CurrentBill>(
      `/billing/table-sessions/${tableSessionId}/current-bill`,
      {
        token,
      }
    );
  },
};
