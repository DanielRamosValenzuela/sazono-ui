import { publicEnv } from "@/shared/config/public-env";
import { ApiError, apiRequest } from "@/shared/api/http-client";
import type {
  FinalizeResult,
  StatementDetail,
  StatementRow,
  StatementsList,
  StatementStatusUpdate,
} from "@/shared/types/platform-billing";

export const platformBillingApi = {
  list(token: string, period: string) {
    return apiRequest<StatementsList>(
      `/platform/statements?period=${encodeURIComponent(period)}`,
      { token }
    );
  },
  detail(token: string, restaurantId: string, period: string) {
    return apiRequest<StatementDetail>(
      `/platform/statements/${restaurantId}?period=${encodeURIComponent(period)}`,
      { token }
    );
  },
  finalize(token: string, period: string) {
    return apiRequest<FinalizeResult>(
      `/platform/statements/${encodeURIComponent(period)}/finalize`,
      { method: "POST", token }
    );
  },
  updateStatus(
    token: string,
    restaurantId: string,
    period: string,
    payload: StatementStatusUpdate
  ) {
    return apiRequest<StatementRow>(
      `/platform/statements/${restaurantId}/${encodeURIComponent(period)}`,
      { method: "PATCH", token, body: payload }
    );
  },
  async downloadCsv(token: string, period: string) {
    let response: Response;

    try {
      response = await fetch(
        `${publicEnv.apiBaseUrl}/platform/statements/export?period=${encodeURIComponent(period)}&format=csv`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
    } catch (error) {
      throw new ApiError("No se pudo conectar con el servidor.", 0, error);
    }

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new ApiError(
        typeof payload?.message === "string"
          ? payload.message
          : `Request failed with status ${response.status}`,
        response.status,
        payload
      );
    }

    return response.blob();
  },
};
