import { apiRequest } from "@/shared/api/http-client";
import type {
  PairDeviceRequest,
  PairDeviceResponse,
  PrintDeviceFailure,
  PrintDeviceHeartbeat,
  PrintDeviceJob,
  PrintDeviceMe,
} from "@/shared/types/print-device";

function deviceHeaders(deviceToken: string) {
  return { Authorization: `Device ${deviceToken}` };
}

export const printDeviceApi = {
  pair(body: PairDeviceRequest) {
    return apiRequest<PairDeviceResponse>("/print/device/pair", {
      method: "POST",
      body,
    });
  },
  me(deviceToken: string) {
    return apiRequest<PrintDeviceMe>("/print/device/me", {
      headers: deviceHeaders(deviceToken),
    });
  },
  setPrinters(deviceToken: string, printerIds: string[]) {
    return apiRequest<{ printers: PairDeviceResponse["printers"] }>(
      "/print/device/printers",
      {
        method: "PUT",
        headers: deviceHeaders(deviceToken),
        body: { printerIds },
      }
    );
  },
  heartbeat(deviceToken: string, body: PrintDeviceHeartbeat) {
    return apiRequest<{ ok: boolean }>("/print/device/heartbeat", {
      method: "POST",
      headers: deviceHeaders(deviceToken),
      body,
    });
  },
  async nextJobs(deviceToken: string, waitSeconds: number, signal: AbortSignal) {
    const payload = await apiRequest<{ jobs: PrintDeviceJob[] } | string>(
      `/print/device/jobs/next?wait=${waitSeconds}`,
      { headers: deviceHeaders(deviceToken), signal }
    );

    return typeof payload === "string" ? [] : payload.jobs;
  },
  ack(deviceToken: string, jobId: string, printedAt: string) {
    return apiRequest<{ result: string }>(`/print/device/jobs/${jobId}/ack`, {
      method: "POST",
      headers: deviceHeaders(deviceToken),
      body: { printedAt },
    });
  },
  fail(deviceToken: string, jobId: string, body: PrintDeviceFailure) {
    return apiRequest<{ result: string }>(`/print/device/jobs/${jobId}/fail`, {
      method: "POST",
      headers: deviceHeaders(deviceToken),
      body,
    });
  },
  extend(deviceToken: string, jobId: string) {
    return apiRequest<{ extended: boolean }>(
      `/print/device/jobs/${jobId}/extend`,
      { method: "POST", headers: deviceHeaders(deviceToken) }
    );
  },
  removeSelf(deviceToken: string) {
    return apiRequest<string>("/print/device/self", {
      method: "DELETE",
      headers: deviceHeaders(deviceToken),
    });
  },
};
