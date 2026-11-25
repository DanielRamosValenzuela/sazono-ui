export type PrintJob = {
  id: string;
  bytesBase64?: string;
  html?: string;
  widthMm: number;
  copies: number;
  cut: boolean;
  drawer: boolean;
  printerId?: string;
  printerName?: string;
  connection?: unknown;
};

export type PrintResult = {
  ok: boolean;
  retryable?: boolean;
  error?: string;
};

export interface PrintTransportClient {
  id: string;
  canPrint(): boolean | Promise<boolean>;
  print(job: PrintJob): Promise<PrintResult>;
}

export type PrinterTarget = {
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

export type PrintTransportRegistration = {
  transport: PrintTransportClient;
  priority: number;
  handles(printer: PrinterTarget): boolean;
};
