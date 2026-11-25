import { apiRequest } from "@/shared/api/http-client";
import type {
  CreateDeviceRequest,
  PairingResult,
  PrintDevice,
  PrintJob,
  PrintJobFilters,
  PrintPreview,
  Printer,
  PrinterInput,
  PrintStation,
  SamplePreviewParams,
} from "@/shared/types/printing";

const base = (branchId: string) => `/branches/${branchId}/print`;

export const printingApi = {
  listPrinters(token: string, branchId: string) {
    return apiRequest<Printer[]>(`${base(branchId)}/printers`, { token });
  },
  createPrinter(token: string, branchId: string, payload: PrinterInput) {
    return apiRequest<Printer>(`${base(branchId)}/printers`, {
      method: "POST",
      token,
      body: payload,
    });
  },
  updatePrinter(
    token: string,
    branchId: string,
    printerId: string,
    payload: PrinterInput
  ) {
    return apiRequest<Printer>(`${base(branchId)}/printers/${printerId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  setPrinterStations(
    token: string,
    branchId: string,
    printerId: string,
    stationIds: string[]
  ) {
    return apiRequest<Printer>(
      `${base(branchId)}/printers/${printerId}/stations`,
      { method: "PUT", token, body: { stationIds } }
    );
  },
  reprintTicket(token: string, branchId: string, stationTicketId: string) {
    return apiRequest<PrintJob[]>(
      `${base(branchId)}/station-tickets/${stationTicketId}/reprint`,
      { method: "POST", token }
    );
  },
  deletePrinter(token: string, branchId: string, printerId: string) {
    return apiRequest<void>(`${base(branchId)}/printers/${printerId}`, {
      method: "DELETE",
      token,
    });
  },
  testPrinter(token: string, branchId: string, printerId: string) {
    return apiRequest<{ jobId: string }>(
      `${base(branchId)}/printers/${printerId}/test`,
      { method: "POST", token }
    );
  },
  listStations(token: string, branchId: string) {
    return apiRequest<PrintStation[]>(`${base(branchId)}/stations`, { token });
  },
  updateStation(
    token: string,
    branchId: string,
    stationId: string,
    payload: { printCode?: string | null; printerIds?: string[] }
  ) {
    return apiRequest<PrintStation>(`${base(branchId)}/stations/${stationId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  listJobs(token: string, branchId: string, filters: PrintJobFilters = {}) {
    const query = new URLSearchParams();

    if (filters.status) {
      query.set("status", filters.status);
    }

    if (filters.kind) {
      query.set("kind", filters.kind);
    }

    if (filters.printerId) {
      query.set("printerId", filters.printerId);
    }

    if (filters.before) {
      query.set("before", filters.before);
    }

    query.set("limit", String(filters.limit ?? 50));

    return apiRequest<PrintJob[]>(`${base(branchId)}/jobs?${query.toString()}`, {
      token,
    });
  },
  jobPreview(token: string, branchId: string, jobId: string) {
    return apiRequest<PrintPreview>(`${base(branchId)}/jobs/${jobId}/preview`, {
      token,
    });
  },
  samplePreview(
    token: string,
    branchId: string,
    params: SamplePreviewParams = {}
  ) {
    const query = new URLSearchParams();

    if (params.printerId) {
      query.set("printerId", params.printerId);
    }

    if (params.stationId) {
      query.set("stationId", params.stationId);
    }

    if (params.columns) {
      query.set("columns", String(params.columns));
    }

    if (params.paperWidthMm) {
      query.set("paperWidthMm", String(params.paperWidthMm));
    }

    return apiRequest<PrintPreview>(
      `${base(branchId)}/preview/sample?${query.toString()}`,
      { token }
    );
  },
  reprintJob(token: string, branchId: string, jobId: string) {
    return apiRequest<PrintJob>(`${base(branchId)}/jobs/${jobId}/reprint`, {
      method: "POST",
      token,
    });
  },
  retryJob(token: string, branchId: string, jobId: string) {
    return apiRequest<PrintJob>(`${base(branchId)}/jobs/${jobId}/retry`, {
      method: "POST",
      token,
    });
  },
  listDevices(token: string, branchId: string) {
    return apiRequest<PrintDevice[]>(`${base(branchId)}/devices`, { token });
  },
  createDevice(token: string, branchId: string, payload: CreateDeviceRequest) {
    return apiRequest<PairingResult>(`${base(branchId)}/devices`, {
      method: "POST",
      token,
      body: payload,
    });
  },
  newPairingCode(token: string, branchId: string, deviceId: string) {
    return apiRequest<PairingResult>(
      `${base(branchId)}/devices/${deviceId}/pairing-code`,
      { method: "POST", token }
    );
  },
  updateDevice(
    token: string,
    branchId: string,
    deviceId: string,
    payload: { name?: string; printerIds?: string[] }
  ) {
    return apiRequest<PrintDevice>(`${base(branchId)}/devices/${deviceId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  revokeDevice(token: string, branchId: string, deviceId: string) {
    return apiRequest<PrintDevice>(`${base(branchId)}/devices/${deviceId}`, {
      method: "DELETE",
      token,
    });
  },
};
