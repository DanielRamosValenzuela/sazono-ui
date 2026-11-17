import { apiRequest, ApiError } from "@/shared/api/http-client";
import { publicEnv } from "@/shared/config/public-env";
import type {
  HierarchyParams,
  PaymentsReportResponse,
  ReportRangeParams,
  SalesByHierarchyResponse,
  SalesByOrderResponse,
} from "@/shared/types/reports";

export type ReportKind = "sales-by-order" | "payments" | "sales-by-hierarchy";

function buildHierarchyQuery(params: HierarchyParams, format?: "csv") {
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
    groupBy: params.groupBy,
    includeModifiers: String(params.includeModifiers),
  });

  if (params.parentId) {
    query.set("parentId", params.parentId);
  }

  if (format) {
    query.set("format", format);
  }

  return query.toString();
}

function buildQuery(params: ReportRangeParams & { format?: "csv" }) {
  const query = new URLSearchParams({ from: params.from, to: params.to });

  if (params.cursor) {
    query.set("cursor", params.cursor);
  }

  if (params.limit) {
    query.set("limit", String(params.limit));
  }

  if (params.format) {
    query.set("format", params.format);
  }

  return query.toString();
}

export const reportsApi = {
  getSalesByOrder(token: string, branchId: string, params: ReportRangeParams) {
    return apiRequest<SalesByOrderResponse>(
      `/reports/branches/${branchId}/sales-by-order?${buildQuery(params)}`,
      { token }
    );
  },
  getPayments(token: string, branchId: string, params: ReportRangeParams) {
    return apiRequest<PaymentsReportResponse>(
      `/reports/branches/${branchId}/payments?${buildQuery(params)}`,
      { token }
    );
  },
  getSalesByHierarchy(token: string, branchId: string, params: HierarchyParams) {
    return apiRequest<SalesByHierarchyResponse>(
      `/reports/branches/${branchId}/sales-by-hierarchy?${buildHierarchyQuery(params)}`,
      { token }
    );
  },
  async downloadCsv(
    token: string,
    branchId: string,
    kind: ReportKind,
    params: ReportRangeParams,
    hierarchy?: Omit<HierarchyParams, keyof ReportRangeParams>
  ) {
    let response: Response;
    const query = hierarchy
      ? buildHierarchyQuery({ ...params, ...hierarchy }, "csv")
      : buildQuery({ ...params, format: "csv" });

    try {
      response = await fetch(
        `${publicEnv.apiBaseUrl}/reports/branches/${branchId}/${kind}?${query}`,
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
