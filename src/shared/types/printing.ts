export type PrinterTransport =
  | "SIMULATED"
  | "TCP"
  | "APP_BRIDGE"
  | "BROWSER"
  | "AGENT"
  | "CLOUDPRNT";

export type PrinterStatus = "UNKNOWN" | "ONLINE" | "OFFLINE" | "ERROR";

export type PrintJobStatus =
  | "PENDING"
  | "CLAIMED"
  | "PRINTED"
  | "FAILED"
  | "CANCELLED";

export type PrintJobKind = "COMANDA" | "VOID" | "TEST";

export type PrintDeviceKind = "ANDROID_APP" | "BROWSER" | "AGENT";

export type PrinterCodepage = "cp858" | "cp850" | "cp437" | "windows1252";

export type PrinterConnection = {
  via?: "tcp" | "bluetooth";
  host?: string;
  port?: number;
  address?: string;
};

export type Printer = {
  id: string;
  branchId: string;
  name: string;
  transport: PrinterTransport;
  connection: PrinterConnection;
  paperWidthMm: number;
  columns: number;
  codepage: PrinterCodepage;
  escTCodepageId: number | null;
  copies: number;
  autoCut: boolean;
  cashDrawer: boolean;
  printVoidSlips: boolean;
  active: boolean;
  status: PrinterStatus;
  lastSeenAt: string | null;
  lastError: string | null;
  stationIds: string[];
  deviceIds: string[];
};

export type PrinterInput = {
  name?: string;
  transport?: PrinterTransport;
  connection?: PrinterConnection;
  paperWidthMm?: number;
  columns?: number;
  codepage?: PrinterCodepage;
  escTCodepageId?: number | null;
  copies?: number;
  autoCut?: boolean;
  cashDrawer?: boolean;
  printVoidSlips?: boolean;
  active?: boolean;
  stationIds?: string[];
};

export type PrintStation = {
  stationId: string;
  name: string;
  stationType: string;
  printCode: string | null;
  printerIds: string[];
};

export type PrintJob = {
  id: string;
  printerId: string;
  printerName: string;
  stationTicketId: string | null;
  kind: PrintJobKind;
  status: PrintJobStatus;
  displayNumber: string | null;
  stationName: string | null;
  attempts: number;
  duplicateAcks: number;
  reprintOfId: string | null;
  reprintNumber?: number | null;
  claimedByDeviceId: string | null;
  lastError: string | null;
  createdAt: string;
  nextAttemptAt: string;
  printedAt: string | null;
};

export type PrintJobFilters = {
  status?: PrintJobStatus;
  kind?: PrintJobKind;
  printerId?: string;
  limit?: number;
  before?: string;
};

export type PrintPreview = {
  jobId: string | null;
  status: PrintJobStatus | null;
  columns: number;
  paperWidthMm: number;
  text: string;
  html: string;
  htmlDocument: string;
  document: unknown;
};

export type SamplePreviewParams = {
  printerId?: string;
  stationId?: string;
  columns?: number;
  paperWidthMm?: number;
};

export type PrintDevice = {
  id: string;
  branchId: string;
  kind: PrintDeviceKind;
  name: string;
  active: boolean;
  paired: boolean;
  pairingPending: boolean;
  pairingExpiresAt: string | null;
  appVersion: string | null;
  lastSeenAt: string | null;
  online: boolean;
  printerIds: string[];
};

export type PairingResult = {
  device: PrintDevice;
  pairingCode: string;
  expiresAt: string;
};

export type CreateDeviceRequest = {
  name?: string;
  kind?: PrintDeviceKind;
  printerIds?: string[];
};
