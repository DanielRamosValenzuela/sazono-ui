export type PaymentGatewayProvider = "MERCADO_PAGO";

export type PaymentAccountStatus =
  | "PENDING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "ERROR";

export interface PaymentAccountStatusResponse {
  provider: PaymentGatewayProvider;
  status: PaymentAccountStatus;
  environment: string;
  externalAccountId: string | null;
  publicKey: string | null;
  liveMode: boolean;
  scope: string | null;
  connectedAt: string | null;
  accessTokenExpiresAt: string | null;
  lastErrorMessage: string | null;
}

export interface MercadoPagoAuthorizationUrlResponse {
  authorizationUrl: string;
  state: string;
  expiresAt: string;
}

export interface QrPaymentConfigResponse {
  gatewayConnected: boolean;
  provider?: PaymentGatewayProvider;
  publicKey?: string;
  environment?: string;
}

export interface CardCheckoutFields {
  cardToken?: string;
  paymentMethodId?: string;
  issuerId?: string;
  installments?: number;
  payerEmail?: string;
}
