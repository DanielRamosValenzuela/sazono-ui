import { apiRequest } from "@/shared/api/http-client";
import type {
  ConfirmRedirectPaymentResponse,
  ConnectTransbankAccountRequest,
  MercadoPagoAuthorizationUrlResponse,
  PaymentAccountStatusResponse,
  PaymentGatewayProvider,
  TransbankReturnRequest,
} from "@/shared/types/payments";

export const paymentAccountsApi = {
  getMercadoPagoStatus(token: string) {
    return apiRequest<PaymentAccountStatusResponse | null>(
      "/payment-accounts/mercado-pago",
      {
        token,
      }
    );
  },
  getMercadoPagoAuthorizationUrl(token: string) {
    return apiRequest<MercadoPagoAuthorizationUrlResponse>(
      "/payment-accounts/mercado-pago/authorization-url",
      {
        method: "POST",
        token,
      }
    );
  },
  disconnectMercadoPago(token: string) {
    return apiRequest<void>("/payment-accounts/mercado-pago", {
      method: "DELETE",
      token,
    });
  },
  getTransbankStatus(token: string) {
    return apiRequest<PaymentAccountStatusResponse | null>(
      "/payment-accounts/transbank",
      {
        token,
      }
    );
  },
  connectTransbank(token: string, payload: ConnectTransbankAccountRequest) {
    return apiRequest<PaymentAccountStatusResponse>(
      "/payment-accounts/transbank",
      {
        method: "POST",
        token,
        body: payload,
      }
    );
  },
  disconnectTransbank(token: string) {
    return apiRequest<void>("/payment-accounts/transbank", {
      method: "DELETE",
      token,
    });
  },
  pauseAccount(token: string, provider: PaymentGatewayProvider) {
    return apiRequest<PaymentAccountStatusResponse>(
      `/payment-accounts/${provider}/pause`,
      {
        method: "PATCH",
        token,
      }
    );
  },
  resumeAccount(token: string, provider: PaymentGatewayProvider) {
    return apiRequest<PaymentAccountStatusResponse>(
      `/payment-accounts/${provider}/resume`,
      {
        method: "PATCH",
        token,
      }
    );
  },
  setPreferredAccount(token: string, provider: PaymentGatewayProvider) {
    return apiRequest<PaymentAccountStatusResponse>(
      `/payment-accounts/${provider}/preferred`,
      {
        method: "PATCH",
        token,
      }
    );
  },
  confirmTransbankReturn(payload: TransbankReturnRequest) {
    return apiRequest<ConfirmRedirectPaymentResponse>(
      "/payment-accounts/transbank/return",
      {
        method: "POST",
        body: payload,
      }
    );
  },
};
