import type { PaymentResult } from "@/shared/types/order";

export type PaymentGatewayProvider = "MERCADO_PAGO" | "TRANSBANK";

export type PaymentAccountStatus =
  | "PENDING"
  | "CONNECTED"
  | "PAUSED"
  | "DISCONNECTED"
  | "ERROR";

export type PaymentGatewayCheckoutMode = "embedded" | "redirect";

export type TransbankEnvironment = "integration" | "production";

export interface PaymentAccountStatusResponse {
  provider: PaymentGatewayProvider;
  status: PaymentAccountStatus;
  environment: string;
  displayPriority: number;
  externalAccountId: string | null;
  publicKey: string | null;
  childCommerceCode: string | null;
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

export interface ConnectTransbankAccountRequest {
  childCommerceCode: string;
  environment?: TransbankEnvironment;
}

export interface QrPaymentConfigOption {
  provider: PaymentGatewayProvider;
  checkoutMode: PaymentGatewayCheckoutMode;
  publicKey?: string;
  environment: string;
  isPreferred: boolean;
}

export interface QrPaymentConfigResponse {
  options: QrPaymentConfigOption[];
}

export interface StartRedirectOrderPaymentRequest {
  provider: PaymentGatewayProvider;
  tipAmount?: string;
}

export interface StartRedirectBillPaymentRequest {
  provider: PaymentGatewayProvider;
  amount: string;
  tipAmount?: string;
}

export interface RedirectPaymentResponse {
  attemptId: string;
  provider: PaymentGatewayProvider;
  redirectUrl: string;
  method: "POST";
  fields: Record<string, string>;
  expiresAt: string;
}

export interface TransbankReturnRequest {
  token_ws?: string;
  TBK_TOKEN?: string;
  TBK_ORDEN_COMPRA?: string;
  TBK_ID_SESION?: string;
}

export type ConfirmRedirectPaymentStatus =
  | "APPROVED"
  | "REJECTED"
  | "ABORTED"
  | "TIMEOUT";

export interface ConfirmRedirectPaymentResponse {
  status: ConfirmRedirectPaymentStatus;
  payment: PaymentResult | null;
  failureReason?: string;
}

export interface CardCheckoutFields {
  cardToken?: string;
  paymentMethodId?: string;
  issuerId?: string;
  installments?: number;
  payerEmail?: string;
}
