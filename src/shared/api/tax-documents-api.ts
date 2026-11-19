import { publicEnv } from "@/shared/config/public-env";
import { ApiError, apiRequest } from "@/shared/api/http-client";
import type {
  ConnectTaxProviderRequest,
  TaxDocument,
  TaxDocumentStatus,
  TaxProviderState,
} from "@/shared/types/tax-documents";

export const taxDocumentsApi = {
  getProvider(token: string, branchId: string) {
    return apiRequest<TaxProviderState>(`/branches/${branchId}/tax-provider`, {
      token,
    });
  },
  connectProvider(
    token: string,
    branchId: string,
    payload: ConnectTaxProviderRequest
  ) {
    return apiRequest<TaxProviderState>(`/branches/${branchId}/tax-provider`, {
      method: "PUT",
      token,
      body: payload,
    });
  },
  disconnectProvider(token: string, branchId: string) {
    return apiRequest<void>(`/branches/${branchId}/tax-provider`, {
      method: "DELETE",
      token,
    });
  },
  list(
    token: string,
    branchId: string,
    params: { status?: TaxDocumentStatus; limit?: number } = {}
  ) {
    const query = new URLSearchParams();

    if (params.status) {
      query.set("status", params.status);
    }

    query.set("limit", String(params.limit ?? 50));

    return apiRequest<TaxDocument[]>(
      `/branches/${branchId}/tax-documents?${query.toString()}`,
      { token }
    );
  },
  listForBill(token: string, branchId: string, billId: string) {
    return apiRequest<TaxDocument[]>(
      `/branches/${branchId}/bills/${billId}/tax-documents`,
      { token }
    );
  },
  retry(token: string, id: string) {
    return apiRequest<TaxDocument>(`/tax-documents/${id}/retry`, {
      method: "POST",
      token,
    });
  },
  reissue(token: string, id: string) {
    return apiRequest<TaxDocument>(`/tax-documents/${id}/reissue`, {
      method: "POST",
      token,
    });
  },
  async fetchPdf(token: string, id: string) {
    let response: Response;

    try {
      response = await fetch(`${publicEnv.apiBaseUrl}/tax-documents/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
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
