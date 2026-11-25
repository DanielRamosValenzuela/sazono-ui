import { registerPlugin } from "@capacitor/core";

export type EscposErrorCode =
  | "TIMEOUT"
  | "REFUSED"
  | "UNREACHABLE"
  | "IO_ERROR"
  | "INVALID_ARGUMENT"
  | "BT_UNAVAILABLE"
  | "BT_PERMISSION_DENIED"
  | "BT_DEVICE_NOT_FOUND"
  | "BT_CONNECT_FAILED";

export type PrintTcpOptions = {
  host: string;
  port: number;
  bytesBase64: string;
  timeoutMs?: number;
};

export type PrintBluetoothOptions = {
  address: string;
  bytesBase64: string;
};

export type BluetoothPrinterInfo = {
  name: string;
  address: string;
};

export interface EscposPrinterPlugin {
  printTcp(options: PrintTcpOptions): Promise<{ bytes: number }>;
  printBluetooth(options: PrintBluetoothOptions): Promise<{ bytes: number }>;
  listBluetoothPrinters(): Promise<{ devices: BluetoothPrinterInfo[] }>;
  keepAwake(options: { enabled: boolean }): Promise<void>;
}

export const EscposPrinter =
  registerPlugin<EscposPrinterPlugin>("EscposPrinter");
