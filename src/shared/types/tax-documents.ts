export type TaxProviderEnvironment = "SANDBOX" | "PRODUCTION";

export type TaxDocumentStatus = "PENDING" | "ISSUED" | "REJECTED";

export type TaxProviderState = {
  configured: boolean;
  provider: "OPENFACTURA";
  status: string | null;
  environment: TaxProviderEnvironment | null;
  apiKeyConfigured: boolean;
  lastVerifiedAt: string | null;
  lastErrorMessage: string | null;
  missingFiscalData: string[];
  pendingDocuments: number;
  stuckDocuments: number;
};

export type ConnectTaxProviderRequest = {
  apiKey: string;
  environment: TaxProviderEnvironment;
};

export type TaxDocument = {
  id: string;
  type: string;
  status: TaxDocumentStatus;
  billId: string;
  branchId: string;
  refundId: string | null;
  folio: number | null;
  issuedAt: string | null;
  netAmount: string;
  vatAmount: string;
  tipAmount: string;
  totalAmount: string;
  attempts: number;
  nextAttemptAt: string | null;
  lastError: string | null;
  needsManualRetry: boolean;
  canRetry: boolean;
  hasPdf: boolean;
  pdfUrl: string | null;
  reason: string | null;
  createdAt: string;
};
