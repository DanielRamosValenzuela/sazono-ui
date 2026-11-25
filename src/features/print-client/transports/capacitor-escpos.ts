import { Capacitor } from "@capacitor/core";
import { EscposPrinter, type EscposErrorCode } from "../native/escpos-printer";
import type {
  PrinterTarget,
  PrintJob,
  PrintResult,
  PrintTransportClient,
} from "./types";

const DEFAULT_PORT = 9100;
const TCP_TIMEOUT_MS = 5000;
const NON_RETRYABLE: EscposErrorCode[] = [
  "INVALID_ARGUMENT",
  "BT_PERMISSION_DENIED",
];

type ResolvedTarget =
  | { via: "tcp"; host: string; port: number }
  | { via: "bluetooth"; address: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function resolveEscposTarget(
  connection: unknown,
): ResolvedTarget | null {
  if (!isRecord(connection)) {
    return null;
  }
  const via = connection.via;
  if (
    (via === "bluetooth" || (via === undefined && connection.address)) &&
    typeof connection.address === "string" &&
    connection.address
  ) {
    return { via: "bluetooth", address: connection.address };
  }
  if (typeof connection.host === "string" && connection.host) {
    const port = Number(connection.port ?? DEFAULT_PORT);
    return {
      via: "tcp",
      host: connection.host,
      port: Number.isInteger(port) ? port : DEFAULT_PORT,
    };
  }
  return null;
}

export function handlesEscposPrinter(printer: PrinterTarget): boolean {
  return (
    printer.transport === "APP_BRIDGE" &&
    resolveEscposTarget(printer.connection) !== null
  );
}

function toResult(error: unknown): PrintResult {
  const code =
    isRecord(error) && typeof error.code === "string" ? error.code : "IO_ERROR";
  return {
    ok: false,
    retryable: !NON_RETRYABLE.includes(code as EscposErrorCode),
    error: code,
  };
}

export const capacitorEscposTransport: PrintTransportClient = {
  id: "capacitor-escpos",
  canPrint() {
    return (
      Capacitor.isNativePlatform() &&
      Capacitor.isPluginAvailable("EscposPrinter")
    );
  },
  async print(job: PrintJob): Promise<PrintResult> {
    if (!job.bytesBase64) {
      return { ok: false, retryable: false, error: "NO_BYTES" };
    }
    const target = resolveEscposTarget(job.connection);
    if (!target) {
      return { ok: false, retryable: false, error: "NO_CONNECTION" };
    }
    const copies = Math.max(1, job.copies);
    try {
      for (let copy = 0; copy < copies; copy += 1) {
        if (target.via === "tcp") {
          await EscposPrinter.printTcp({
            host: target.host,
            port: target.port,
            bytesBase64: job.bytesBase64,
            timeoutMs: TCP_TIMEOUT_MS,
          });
        } else {
          await EscposPrinter.printBluetooth({
            address: target.address,
            bytesBase64: job.bytesBase64,
          });
        }
      }
      return { ok: true };
    } catch (error) {
      return toResult(error);
    }
  },
};
