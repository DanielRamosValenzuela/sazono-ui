export interface MercadoPagoInitOptions {
  locale?: string;
}

export interface MercadoPagoCardPaymentIdentification {
  type: string;
  number: string;
}

export interface MercadoPagoCardPaymentPayerInit {
  email?: string;
  identification?: Partial<MercadoPagoCardPaymentIdentification>;
}

export interface MercadoPagoCardPaymentInitialization {
  amount: number;
  payer?: MercadoPagoCardPaymentPayerInit;
}

export interface MercadoPagoCardPaymentVisualCustomization {
  style?: {
    theme?: "default" | "dark" | "flat" | "bootstrap";
    customVariables?: Record<string, string>;
  };
  hidePaymentButton?: boolean;
  texts?: Record<string, string>;
}

export interface MercadoPagoCardPaymentMethodsCustomization {
  minInstallments?: number;
  maxInstallments?: number;
  types?: {
    excluded?: string[];
    included?: string[];
  };
}

export interface MercadoPagoCardPaymentCustomization {
  visual?: MercadoPagoCardPaymentVisualCustomization;
  paymentMethods?: MercadoPagoCardPaymentMethodsCustomization;
}

export interface MercadoPagoCardPaymentFormData {
  token: string;
  issuer_id: string;
  payment_method_id: string;
  transaction_amount: number;
  payment_method_option_id: string | null;
  processing_mode: string | null;
  installments: number;
  payer: {
    email: string;
    identification: MercadoPagoCardPaymentIdentification;
  };
}

export interface MercadoPagoCardPaymentAdditionalData {
  bin: string;
  lastFourDigits: string;
  cardholderName: string;
  paymentTypeId: string;
}

export type MercadoPagoBrickErrorType = "non_critical" | "critical";

export interface MercadoPagoBrickError {
  type: MercadoPagoBrickErrorType;
  message: string;
  cause: string;
}

export interface MercadoPagoCardPaymentCallbacks {
  onReady: () => void;
  onError: (error: MercadoPagoBrickError) => void;
  onSubmit?: (
    cardData: MercadoPagoCardPaymentFormData
  ) => Promise<void>;
  onBinChange?: (bin: string) => void;
}

export interface MercadoPagoCardPaymentSettings {
  initialization: MercadoPagoCardPaymentInitialization;
  customization?: MercadoPagoCardPaymentCustomization;
  callbacks: MercadoPagoCardPaymentCallbacks;
}

export interface MercadoPagoCardPaymentBrickController {
  unmount: () => void;
  getFormData: () => Promise<MercadoPagoCardPaymentFormData>;
  getAdditionalData: () => Promise<MercadoPagoCardPaymentAdditionalData>;
  update: (settings: { amount: number }) => Promise<boolean>;
}

export interface MercadoPagoBricksBuilder {
  create(
    brickType: "cardPayment",
    containerId: string,
    settings: MercadoPagoCardPaymentSettings
  ): Promise<MercadoPagoCardPaymentBrickController>;
}

export interface MercadoPagoInstance {
  bricks(): MercadoPagoBricksBuilder;
}

export type MercadoPagoConstructor = new (
  publicKey: string,
  options?: MercadoPagoInitOptions
) => MercadoPagoInstance;
