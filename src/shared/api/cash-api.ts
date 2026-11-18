import { apiRequest } from "@/shared/api/http-client";
import type {
  CashCloseResult,
  CashMovement,
  CashSession,
  CloseCashSessionRequest,
  CreateCashMovementRequest,
} from "@/shared/types/cash";

export const cashApi = {
  current(token: string, branchId: string) {
    return apiRequest<{ session: CashSession | null }>(
      `/branches/${branchId}/cash-sessions/current`,
      { token },
    );
  },
  open(
    token: string,
    branchId: string,
    payload: { registerLabel?: string; openingFloat: string },
  ) {
    return apiRequest<CashSession>(`/branches/${branchId}/cash-sessions/open`, {
      method: "POST",
      token,
      body: payload,
    });
  },
  close(
    token: string,
    branchId: string,
    sessionId: string,
    payload: CloseCashSessionRequest,
  ) {
    return apiRequest<CashCloseResult>(
      `/branches/${branchId}/cash-sessions/${sessionId}/close`,
      { method: "POST", token, body: payload },
    );
  },
  forceClose(
    token: string,
    branchId: string,
    sessionId: string,
    payload: CloseCashSessionRequest,
  ) {
    return apiRequest<CashCloseResult>(
      `/branches/${branchId}/cash-sessions/${sessionId}/force-close`,
      { method: "POST", token, body: payload },
    );
  },
  listSessions(token: string, branchId: string, status?: "OPEN" | "CLOSED") {
    const query = status ? `?status=${status}` : "";
    return apiRequest<{ sessions: CashSession[] }>(
      `/branches/${branchId}/cash-sessions${query}`,
      { token },
    );
  },
  listMovements(token: string, branchId: string, cashSessionId?: string) {
    const query = cashSessionId ? `?cashSessionId=${cashSessionId}` : "";
    return apiRequest<{ movements: CashMovement[] }>(
      `/branches/${branchId}/cash-movements${query}`,
      { token },
    );
  },
  createMovement(
    token: string,
    branchId: string,
    idempotencyKey: string,
    payload: CreateCashMovementRequest,
  ) {
    return apiRequest<CashMovement>(`/branches/${branchId}/cash-movements`, {
      method: "POST",
      token,
      body: payload,
      headers: { "Idempotency-Key": idempotencyKey },
    });
  },
};
