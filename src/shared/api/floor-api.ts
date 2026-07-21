import { apiRequest } from "@/shared/api/http-client";
import type {
  AbandonTableSessionRequest,
  AssignTableSessionRequest,
  CloseTableSessionRequest,
  CreateFloorTableRequest,
  FloorTable,
  OpenTableSessionRequest,
  TableSessionDetail,
} from "@/shared/types/floor";

export const floorApi = {
  listTables(token: string, branchId: string) {
    return apiRequest<FloorTable[]>(
      `/floor/tables?branchId=${encodeURIComponent(branchId)}`,
      {
        token,
      }
    );
  },
  createTable(token: string, payload: CreateFloorTableRequest) {
    return apiRequest<FloorTable>("/floor/tables", {
      method: "POST",
      token,
      body: payload,
    });
  },
  openTableSession(token: string, payload: OpenTableSessionRequest) {
    return apiRequest<TableSessionDetail>("/floor/table-sessions/open", {
      method: "POST",
      token,
      body: payload,
    });
  },
  getCurrentSession(token: string, tableId: string) {
    return apiRequest<TableSessionDetail>(`/floor/tables/${tableId}/current-session`, {
      token,
    });
  },
  closeTableSession(
    token: string,
    tableSessionId: string,
    payload: CloseTableSessionRequest
  ) {
    return apiRequest<TableSessionDetail>(`/floor/table-sessions/${tableSessionId}/close`, {
      method: "POST",
      token,
      body: payload,
    });
  },
  abandonTableSession(
    token: string,
    tableSessionId: string,
    payload: AbandonTableSessionRequest
  ) {
    return apiRequest<TableSessionDetail>(`/floor/table-sessions/${tableSessionId}/abandon`, {
      method: "POST",
      token,
      body: payload,
    });
  },
  assignTableSession(
    token: string,
    tableSessionId: string,
    payload: AssignTableSessionRequest
  ) {
    return apiRequest<TableSessionDetail>(`/floor/table-sessions/${tableSessionId}/assign`, {
      method: "POST",
      token,
      body: payload,
    });
  },
};
