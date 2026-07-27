"use client";

import { useEffect, useState } from "react";
import type { MercadoPagoInstance } from "@/shared/types/mercado-pago";
import { getMercadoPagoInstance } from "./load-mercado-pago-sdk";

export type MercadoPagoSdkStatus = "idle" | "loading" | "ready" | "error";

export type UseMercadoPagoSdkResult = {
  status: MercadoPagoSdkStatus;
  instance: MercadoPagoInstance | null;
  error: unknown;
};

export function useMercadoPagoSdk(
  publicKey: string | undefined
): UseMercadoPagoSdkResult {
  const [result, setResult] = useState<UseMercadoPagoSdkResult>({
    status: "loading",
    instance: null,
    error: null,
  });

  useEffect(() => {
    if (!publicKey) {
      return;
    }

    let cancelled = false;

    const loadSdk = async () => {
      setResult({ status: "loading", instance: null, error: null });

      try {
        const instance = await getMercadoPagoInstance(publicKey);

        if (!cancelled) {
          setResult({ status: "ready", instance, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setResult({ status: "error", instance: null, error });
        }
      }
    };

    void loadSdk();

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  if (!publicKey) {
    return { status: "idle", instance: null, error: null };
  }

  return result;
}
