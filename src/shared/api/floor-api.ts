import { apiRequest } from "@/shared/api/http-client";
import type {
  AbandonTableSessionRequest,
  AssignTableSessionRequest,
  BranchStaffMember,
  CloseTableSessionRequest,
  CreateFloorTableRequest,
  CreateTableZoneRequest,
  FloorTable,
  OpenTableSessionRequest,
  RenameTableZoneRequest,
  SetTableZoneRequest,
  SetZoneStaffRequest,
  TableSessionDetail,
  TableZone,
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
  listZones(token: string, branchId: string) {
    return apiRequest<TableZone[]>(
      `/floor/zones?branchId=${encodeURIComponent(branchId)}`,
      {
        token,
      }
    );
  },
  createZone(token: string, payload: CreateTableZoneRequest) {
    return apiRequest<TableZone>("/floor/zones", {
      method: "POST",
      token,
      body: payload,
    });
  },
  renameZone(token: string, zoneId: string, payload: RenameTableZoneRequest) {
    return apiRequest<TableZone>(`/floor/zones/${zoneId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  deleteZone(token: string, zoneId: string) {
    return apiRequest<void>(`/floor/zones/${zoneId}`, {
      method: "DELETE",
      token,
    });
  },
  setTableZone(token: string, tableId: string, payload: SetTableZoneRequest) {
    return apiRequest<FloorTable>(`/floor/tables/${tableId}/zone`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  setZoneStaff(token: string, zoneId: string, payload: SetZoneStaffRequest) {
    return apiRequest<TableZone>(`/floor/zones/${zoneId}/staff`, {
      method: "PUT",
      token,
      body: payload,
    });
  },
  listBranchStaff(token: string, branchId: string) {
    return apiRequest<BranchStaffMember[]>(
      `/floor/branch-staff?branchId=${encodeURIComponent(branchId)}`,
      {
        token,
      }
    );
  },
};
