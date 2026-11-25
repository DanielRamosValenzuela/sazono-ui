import type {
  PrinterTarget,
  PrintTransportClient,
  PrintTransportRegistration,
} from "./types";

const registrations = new Map<string, PrintTransportRegistration>();

export function registerPrintTransport(
  registration: PrintTransportRegistration,
) {
  registrations.set(registration.transport.id, registration);
}

export function unregisterPrintTransport(id: string) {
  registrations.delete(id);
}

export function listPrintTransports(): PrintTransportRegistration[] {
  return [...registrations.values()].sort((a, b) => b.priority - a.priority);
}

export async function resolvePrintTransport(
  printer: PrinterTarget,
): Promise<PrintTransportClient | null> {
  for (const registration of listPrintTransports()) {
    if (!registration.handles(printer)) {
      continue;
    }
    try {
      if (await registration.transport.canPrint()) {
        return registration.transport;
      }
    } catch {}
  }

  return null;
}
