import { apiRequest } from "@/shared/api/http-client";
import type {
  MercadoPagoAuthorizationUrlResponse,
  PaymentAccountStatusResponse,
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
};
