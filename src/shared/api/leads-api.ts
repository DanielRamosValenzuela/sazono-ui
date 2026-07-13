import { apiRequest } from "@/shared/api/http-client";
import type { CreateLeadRequest, Lead } from "@/shared/types/leads";

export const leadsApi = {
  create(payload: CreateLeadRequest) {
    return apiRequest<Lead>("/leads", {
      method: "POST",
      body: payload,
    });
  },
  list(token: string) {
    return apiRequest<Lead[]>("/leads", {
      token,
    });
  },
};
