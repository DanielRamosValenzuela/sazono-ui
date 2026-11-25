import { ApiError } from "@/shared/api/http-client";
import { printDeviceApi } from "@/shared/api/print-device-api";
import type { PrintDeviceJob } from "@/shared/types/print-device";
import { resolvePrintTransport } from "../transports/registry";
import type { PrinterTarget, PrintResult } from "../transports/types";
import { usePrintClientStore } from "./print-client.store";
import {
  clearCredentials,
  loadPendingAcks,
  savePendingAcks,
  type DeviceCredentials,
  type PendingAck,
} from "./storage";

const WAIT_SECONDS = 25;
const REQUEST_TIMEOUT_MS = (WAIT_SECONDS + 15) * 1000;
const HEARTBEAT_MS = 25_000;
const EXTEND_MS = 20_000;
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30_000;
const MIN_CYCLE_MS = 800;
const ACK_ATTEMPTS = 3;
const PRINTERS_REFRESH_EVERY = 10;

type WakeCause = "wake" | "online";

const TERMINAL_ACK_STATUSES = [400, 401, 403, 404, 409];
const wakeListeners = new Set<(cause: WakeCause) => void>();
const cancelListeners = new Set<() => void>();

export function wakePrintLoop() {
  wakeListeners.forEach((listener) => listener("wake"));
}

export function cancelPrintRequest() {
  cancelListeners.forEach((listener) => listener());
  wakeListeners.forEach((listener) => listener("online"));
}

function sleep(
  ms: number,
  signal: AbortSignal,
  onlineOnly = false,
): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const done = () => {
      window.clearTimeout(timer);
      wakeListeners.delete(onWake);
      signal.removeEventListener("abort", done);
      resolve();
    };
    const onWake = (cause: WakeCause) => {
      if (!onlineOnly || cause === "online") {
        done();
      }
    };
    const timer = window.setTimeout(done, ms);
    wakeListeners.add(onWake);
    signal.addEventListener("abort", done);
  });
}

function backoffMs(failures: number) {
  const base = Math.min(BACKOFF_BASE_MS * 2 ** (failures - 1), BACKOFF_MAX_MS);

  return base / 2 + Math.random() * (base / 2);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "ERROR";
}

function isRevoked(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

function isTerminalAckError(error: unknown) {
  return (
    error instanceof ApiError && TERMINAL_ACK_STATUSES.includes(error.status)
  );
}

function isOffline() {
  return navigator.onLine === false;
}

function store() {
  return usePrintClientStore.getState();
}

async function revoke() {
  await clearCredentials();
  store().setCredentials(null);
}

async function refreshPrinters(token: string) {
  const me = await printDeviceApi.me(token);

  store().setPrinters(me.printers);

  return me.printers;
}

async function sendHeartbeat(token: string) {
  const reports = await Promise.all(
    store().printers.map(async (printer) => {
      const transport = await resolvePrintTransport(printer);

      return transport
        ? { printerId: printer.id, ok: true }
        : { printerId: printer.id, ok: false, detail: "NO_TRANSPORT" };
    }),
  );

  await printDeviceApi.heartbeat(token, { printers: reports });
}

async function flushPendingAcks(token: string) {
  const pending = await loadPendingAcks();

  if (pending.length === 0) {
    return;
  }

  const remaining: PendingAck[] = [];

  for (const ack of pending) {
    try {
      await printDeviceApi.ack(token, ack.jobId, ack.printedAt);
    } catch (error) {
      if (!isTerminalAckError(error)) {
        remaining.push(ack);
      }
    }
  }

  await savePendingAcks(remaining);
}

async function reportPrinted(token: string, jobId: string) {
  const printedAt = new Date().toISOString();

  for (let attempt = 1; attempt <= ACK_ATTEMPTS; attempt += 1) {
    try {
      await printDeviceApi.ack(token, jobId, printedAt);

      return;
    } catch (error) {
      if (isTerminalAckError(error)) {
        return;
      }
      await new Promise((resolve) =>
        window.setTimeout(resolve, attempt * 1000),
      );
    }
  }

  const pending = await loadPendingAcks();

  await savePendingAcks([...pending, { jobId, printedAt }]);
}

async function reportFailed(
  token: string,
  jobId: string,
  code: string,
  message: string,
  retryable: boolean,
) {
  try {
    await printDeviceApi.fail(token, jobId, {
      code,
      message: message.slice(0, 400),
      retryable,
    });
  } catch {}
}

async function findPrinter(
  token: string,
  printerId: string,
): Promise<PrinterTarget | null> {
  const known = store().printers.find((printer) => printer.id === printerId);

  if (known) {
    return known;
  }
  try {
    const printers = await refreshPrinters(token);

    return printers.find((printer) => printer.id === printerId) ?? null;
  } catch {
    return null;
  }
}

async function printJob(token: string, job: PrintDeviceJob) {
  const printer = await findPrinter(token, job.printerId);
  const record = (ok: boolean, error: string | null) =>
    store().setLastJob({
      number: job.displayNumber,
      station: job.station,
      at: Date.now(),
      ok,
      error,
    });

  if (!printer) {
    await reportFailed(
      token,
      job.jobId,
      "PRINTER_UNKNOWN",
      "Impresora no asignada",
      false,
    );
    record(false, "PRINTER_UNKNOWN");

    return;
  }

  const transport = await resolvePrintTransport(printer);

  if (!transport) {
    await reportFailed(
      token,
      job.jobId,
      "NO_TRANSPORT",
      "Sin transporte de impresion",
      false,
    );
    record(false, "NO_TRANSPORT");

    return;
  }

  let result: PrintResult;

  try {
    result = await transport.print({
      id: job.jobId,
      bytesBase64: job.escposBase64,
      html: job.html,
      widthMm: printer.paperWidthMm,
      copies: 1,
      cut: job.cut,
      drawer: false,
      printerId: printer.id,
      printerName: printer.name,
      connection: job.connection,
    });
  } catch (error) {
    result = { ok: false, retryable: true, error: errorMessage(error) };
  }

  if (result.ok) {
    await reportPrinted(token, job.jobId);
    record(true, null);

    return;
  }

  const message = result.error ?? "PRINT_ERROR";

  await reportFailed(
    token,
    job.jobId,
    "PRINT_ERROR",
    message,
    result.retryable ?? true,
  );
  record(false, message);
}

async function processBatch(
  token: string,
  jobs: PrintDeviceJob[],
  signal: AbortSignal,
) {
  const pending = new Set(jobs.map((job) => job.jobId));
  const timer = window.setInterval(() => {
    pending.forEach((jobId) => {
      void printDeviceApi.extend(token, jobId).catch(() => undefined);
    });
  }, EXTEND_MS);

  try {
    for (const job of jobs) {
      if (signal.aborted) {
        break;
      }
      store().setQueue(pending.size);
      try {
        await printJob(token, job);
      } finally {
        pending.delete(job.jobId);
      }
    }
  } finally {
    window.clearInterval(timer);
    store().setQueue(0);
  }
}

export async function runPrintLoop(
  credentials: DeviceCredentials,
  signal: AbortSignal,
) {
  const token = credentials.token;
  let failures = 0;
  let beats = 0;

  const heartbeat = async () => {
    try {
      beats += 1;
      if (beats % PRINTERS_REFRESH_EVERY === 0) {
        await refreshPrinters(token);
      }
      await sendHeartbeat(token);
      if (store().status !== "connected") {
        store().setStatus("connected", null);
      }
    } catch (error) {
      if (isRevoked(error)) {
        await revoke();
      }
    }
  };

  const onOnline = () => cancelPrintRequest();
  const onVisible = () => {
    if (document.visibilityState === "visible") {
      cancelPrintRequest();
      void heartbeat();
    }
  };

  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVisible);
  const removeListeners = () => {
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onVisible);
  };

  store().setStatus("connecting");

  try {
    await refreshPrinters(token);
    if (!signal.aborted) {
      await flushPendingAcks(token);
    }
  } catch (error) {
    if (isRevoked(error)) {
      await revoke();
      removeListeners();

      return;
    }
  }

  if (signal.aborted) {
    removeListeners();

    return;
  }

  void heartbeat();
  const beatTimer = window.setInterval(() => void heartbeat(), HEARTBEAT_MS);

  try {
    while (!signal.aborted && store().credentials) {
      if (isOffline()) {
        store().setStatus("offline");
        await sleep(5000, signal);
        continue;
      }

      const request = new AbortController();
      const cancel = () => request.abort();
      const timeout = window.setTimeout(cancel, REQUEST_TIMEOUT_MS);
      const started = Date.now();

      cancelListeners.add(cancel);
      signal.addEventListener("abort", cancel);

      try {
        const jobs = await printDeviceApi.nextJobs(
          token,
          WAIT_SECONDS,
          request.signal,
        );

        failures = 0;
        if (store().status !== "connected") {
          store().setStatus("connected", null);
        }
        if (jobs.length > 0) {
          await processBatch(token, jobs, signal);
          await flushPendingAcks(token);
        } else if (Date.now() - started < MIN_CYCLE_MS) {
          await sleep(MIN_CYCLE_MS, signal);
        }
      } catch (error) {
        if (signal.aborted) {
          break;
        }
        if (isRevoked(error)) {
          await revoke();

          return;
        }
        if (request.signal.aborted) {
          continue;
        }
        failures += 1;
        store().setStatus(
          isOffline() ? "offline" : "error",
          errorMessage(error),
        );
        await sleep(backoffMs(failures), signal, true);
      } finally {
        window.clearTimeout(timeout);
        cancelListeners.delete(cancel);
        signal.removeEventListener("abort", cancel);
      }
    }
  } finally {
    window.clearInterval(beatTimer);
    removeListeners();
  }
}
