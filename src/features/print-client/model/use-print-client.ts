"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { EscposPrinter } from "../native/escpos-printer";
import { printDeviceApi } from "@/shared/api/print-device-api";
import { registerBuiltinPrintTransports } from "../transports/builtin";
import { resolvePrintTransport } from "../transports/registry";
import type { PrinterTarget } from "../transports/types";
import { usePrintClientStore } from "./print-client.store";
import { runPrintLoop, wakePrintLoop } from "./print-loop";
import {
  clearCredentials,
  loadCredentials,
  loadPreviewRemainingMs,
  PREVIEW_TTL_MS,
  saveCredentials,
  savePreviewMode,
} from "./storage";
import { buildTestJob } from "./test-job";

export const PRINT_WAKE_EVENT = "sazono:print-wake";
const LOCK_NAME = "sazono-print-loop";

let previewTimer: number | undefined;

function schedulePreviewExpiry(ms: number) {
  window.clearTimeout(previewTimer);
  previewTimer =
    ms > 0
      ? window.setTimeout(() => void setPrintPreviewMode(false), ms)
      : undefined;
}

export function usePrintClientRunner() {
  const token = usePrintClientStore(
    (state) => state.credentials?.token ?? null,
  );
  const hydrated = usePrintClientStore((state) => state.hydrated);

  useEffect(() => {
    registerBuiltinPrintTransports();
    let cancelled = false;

    void Promise.all([loadCredentials(), loadPreviewRemainingMs()]).then(
      ([credentials, previewRemaining]) => {
        if (!cancelled) {
          usePrintClientStore
            .getState()
            .setHydrated(credentials, previewRemaining > 0);
          schedulePreviewExpiry(previewRemaining);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onWake = () => wakePrintLoop();

    window.addEventListener(PRINT_WAKE_EVENT, onWake);

    return () => window.removeEventListener(PRINT_WAKE_EVENT, onWake);
  }, []);

  useEffect(() => {
    const credentials = usePrintClientStore.getState().credentials;

    if (!hydrated || !token || !credentials) {
      return;
    }

    const controller = new AbortController();
    const keepAwake =
      Capacitor.isNativePlatform() &&
      Capacitor.isPluginAvailable("EscposPrinter");
    const setAwake = (enabled: boolean) => {
      if (keepAwake) {
        void EscposPrinter.keepAwake({ enabled }).catch(() => undefined);
      }
    };
    const start = async () => {
      setAwake(true);
      try {
        await runPrintLoop(credentials, controller.signal);
      } finally {
        setAwake(false);
      }
    };

    if (typeof navigator !== "undefined" && navigator.locks) {
      usePrintClientStore.getState().setStatus("standby");
      void navigator.locks
        .request(LOCK_NAME, { signal: controller.signal }, start)
        .catch(() => undefined);
    } else {
      void start();
    }

    return () => controller.abort();
  }, [hydrated, token]);
}

export async function pairPrintDevice(code: string, name: string) {
  const response = await printDeviceApi.pair({
    code,
    name,
    kind: Capacitor.isNativePlatform() ? "ANDROID_APP" : "BROWSER",
  });
  const credentials = {
    deviceId: response.deviceId,
    token: response.token,
    branchId: response.branchId,
    name,
  };

  await saveCredentials(credentials);
  const store = usePrintClientStore.getState();

  store.setPrinters(response.printers);
  store.setCredentials(credentials);

  return response;
}

export async function unpairPrintDevice(): Promise<boolean> {
  const credentials = usePrintClientStore.getState().credentials;
  let remoteOk = true;

  if (credentials) {
    remoteOk = await printDeviceApi
      .removeSelf(credentials.token)
      .then(() => true)
      .catch(() => false);
  }
  await clearCredentials();
  usePrintClientStore.getState().setCredentials(null);

  return remoteOk;
}

export async function choosePrintPrinters(printerIds: string[]) {
  const credentials = usePrintClientStore.getState().credentials;

  if (!credentials) {
    return;
  }
  const response = await printDeviceApi.setPrinters(
    credentials.token,
    printerIds,
  );

  usePrintClientStore.getState().setPrinters(response.printers);
}

export async function setPrintPreviewMode(enabled: boolean) {
  usePrintClientStore.getState().setPreviewMode(enabled);
  schedulePreviewExpiry(enabled ? PREVIEW_TTL_MS : 0);
  await savePreviewMode(enabled);
}

export async function printLocalTest(printer: PrinterTarget, title: string) {
  const transport = await resolvePrintTransport(printer);

  if (!transport) {
    return { ok: false, retryable: false, error: "NO_TRANSPORT" };
  }

  return transport.print(buildTestJob(printer, title));
}
