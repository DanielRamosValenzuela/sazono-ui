export type PrintDeviceKind = "ANDROID_APP" | "BROWSER";

export type PrintDevicePrinter = {
  id: string;
  name: string;
  transport: string;
  connection: unknown;
  paperWidthMm: number;
  columns: number;
  copies: number;
  autoCut: boolean;
  status: string;
};

export type PairDeviceRequest = {
  code: string;
  name: string;
  kind: PrintDeviceKind;
  appVersion?: string;
};

export type PairDeviceResponse = {
  deviceId: string;
  token: string;
  branchId: string;
  printers: PrintDevicePrinter[];
};

export type PrintDeviceMe = {
  deviceId: string;
  branchId: string;
  kind: string;
  name: string;
  printers: PrintDevicePrinter[];
  availablePrinters: PrintDevicePrinter[];
};

export type PrintDeviceJob = {
  jobId: string;
  printerId: string;
  printerName: string;
  kind: string;
  displayNumber: string;
  station: string;
  attempt: number;
  leaseUntil: string | null;
  copies: number;
  cut: boolean;
  retryUncertain: boolean;
  connection: unknown;
  escposBase64: string;
  html: string;
};

export type PrintDeviceHeartbeat = {
  appVersion?: string;
  printers: { printerId: string; ok: boolean; detail?: string }[];
};

export type PrintDeviceFailure = {
  code: string;
  message: string;
  retryable: boolean;
};
