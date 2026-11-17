import { apiRequest, ApiError } from "@/shared/api/http-client";
import { publicEnv } from "@/shared/config/public-env";
import {
  DEFAULT_REPORT_SORT,
  REPORT_FILTER_SUPPORT,
  type HierarchyParams,
  type OrderDetailResponse,
  type PaymentsReportResponse,
  type ReportFilterOptions,
  type ReportKindKey,
  type ReportRangeParams,
  type SalesByHierarchyResponse,
  type SalesByOrderResponse,
} from "@/shared/types/reports";

export type ReportKind = ReportKindKey;

const PAYMENTS_RENAMES: Record<string, string> = {
  minTotal: "minAmount",
  maxTotal: "maxAmount",
};

const SORT_PARAMS: Record<ReportKind, Record<string, string>> = {
  "sales-by-order": {
    date: "closedAt",
    total: "total",
    tip: "tip",
    order: "orderNumber",
  },
  payments: { date: "eventAt", total: "amount", tip: "tip", order: "eventAt" },
  "sales-by-hierarchy": {},
};

export function retryReportRequest(failureCount: number, error: Error) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }

  return failureCount < 2;
}

function buildQuery(
  kind: ReportKind,
  params: ReportRangeParams,
  extra: Record<string, string | undefined> = {}
) {
  const query = new URLSearchParams({ from: params.from, to: params.to });

  for (const key of REPORT_FILTER_SUPPORT[kind]) {
    const value = params.filters?.[key];

    if (value) {
      query.set(kind === "payments" ? (PAYMENTS_RENAMES[key] ?? key) : key, value);
    }
  }

  const sortParam = params.sort ? SORT_PARAMS[kind][params.sort.field] : undefined;

  if (
    params.sort &&
    sortParam &&
    (params.sort.field !== DEFAULT_REPORT_SORT.field ||
      params.sort.direction !== DEFAULT_REPORT_SORT.direction)
  ) {
    query.set("orderBy", sortParam);
    query.set("direction", params.sort.direction);
  }

  if (params.cursor) {
    query.set("cursor", params.cursor);
  }

  if (params.limit) {
    query.set("limit", String(params.limit));
  }

  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined) {
      query.set(key, value);
    }
  }

  return query.toString();
}

function hierarchyExtra(params: HierarchyParams): Record<string, string | undefined> {
  return {
    groupBy: params.groupBy,
    includeModifiers: String(params.includeModifiers),
    parentId: params.parentId,
  };
}

export const reportsApi = {
  getSalesByOrder(token: string, branchId: string, params: ReportRangeParams) {
    return apiRequest<SalesByOrderResponse>(
      `/reports/branches/${branchId}/sales-by-order?${buildQuery("sales-by-order", params)}`,
      { token }
    );
  },
  getPayments(token: string, branchId: string, params: ReportRangeParams) {
    return apiRequest<PaymentsReportResponse>(
      `/reports/branches/${branchId}/payments?${buildQuery("payments", params)}`,
      { token }
    );
  },
  getSalesByHierarchy(token: string, branchId: string, params: HierarchyParams) {
    return apiRequest<SalesByHierarchyResponse>(
      `/reports/branches/${branchId}/sales-by-hierarchy?${buildQuery("sales-by-hierarchy", params, hierarchyExtra(params))}`,
      { token }
    );
  },
  getFilterOptions(token: string, branchId: string) {
    return apiRequest<ReportFilterOptions>(
      `/reports/branches/${branchId}/filter-options`,
      { token }
    );
  },
  getOrderDetail(token: string, branchId: string, billId: string) {
    return apiRequest<OrderDetailResponse>(
      `/reports/branches/${branchId}/orders/${billId}/detail`,
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
    const query = buildQuery(kind, params, {
      format: "csv",
      ...(hierarchy ? hierarchyExtra({ ...params, ...hierarchy }) : {}),
    });

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
