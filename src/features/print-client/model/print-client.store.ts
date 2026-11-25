import { create } from "zustand";
import type { PrinterTarget, PrintJob } from "../transports/types";
import type { DeviceCredentials } from "./storage";

export type PrintClientStatus =
  | "idle"
  | "standby"
  | "connecting"
  | "connected"
  | "offline"
  | "error"
  | "unpaired";

export type LastPrintJob = {
  number: string;
  station: string;
  at: number;
  ok: boolean;
  error: string | null;
};

type PrintClientState = {
  hydrated: boolean;
  credentials: DeviceCredentials | null;
  printers: PrinterTarget[];
  status: PrintClientStatus;
  lastError: string | null;
  lastJob: LastPrintJob | null;
  queue: number;
  printedCount: number;
  previewMode: boolean;
  preview: PrintJob | null;
  setHydrated(
    credentials: DeviceCredentials | null,
    previewMode: boolean,
  ): void;
  setCredentials(credentials: DeviceCredentials | null): void;
  setPrinters(printers: PrinterTarget[]): void;
  setStatus(status: PrintClientStatus, error?: string | null): void;
  setQueue(queue: number): void;
  setLastJob(job: LastPrintJob): void;
  setPreviewMode(enabled: boolean): void;
  setPreview(job: PrintJob | null): void;
};

export const usePrintClientStore = create<PrintClientState>((set) => ({
  hydrated: false,
  credentials: null,
  printers: [],
  status: "idle",
  lastError: null,
  lastJob: null,
  queue: 0,
  printedCount: 0,
  previewMode: false,
  preview: null,
  setHydrated: (credentials, previewMode) =>
    set({ hydrated: true, credentials, previewMode }),
  setCredentials: (credentials) =>
    set(
      credentials
        ? { credentials }
        : { credentials: null, printers: [], status: "unpaired", queue: 0 },
    ),
  setPrinters: (printers) => set({ printers }),
  setStatus: (status, error) =>
    set((state) => ({
      status,
      lastError: error === undefined ? state.lastError : error,
    })),
  setQueue: (queue) => set({ queue }),
  setLastJob: (job) =>
    set((state) => ({
      lastJob: job,
      printedCount: state.printedCount + (job.ok ? 1 : 0),
      lastError: job.ok ? state.lastError : job.error,
    })),
  setPreviewMode: (previewMode) => set({ previewMode }),
  setPreview: (preview) => set({ preview }),
}));
