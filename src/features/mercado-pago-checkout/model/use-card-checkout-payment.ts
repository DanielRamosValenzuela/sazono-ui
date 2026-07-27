"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/shared/api/http-client";
import type { CardCheckoutFields } from "@/shared/types/payments";

export type CardCheckoutPhase = "idle" | "submitting" | "verifying";

export type CardCheckoutPollOutcome = "approved" | "declined" | "unresolved";

export type CardCheckoutDeclineReason = "declined" | "unverified";

export type UseCardCheckoutPaymentOptions = {
  submit: (checkout: CardCheckoutFields, signal: AbortSignal) => Promise<void>;
  pollStatus: () => Promise<CardCheckoutPollOutcome>;
  onApproved: () => void;
  onDeclined: (reason: CardCheckoutDeclineReason, message: string) => void;
  submitTimeoutMs?: number;
  pollIntervalMs?: number;
  pollTimeoutMs?: number;
};

const DEFAULT_SUBMIT_TIMEOUT_MS = 20_000;
const DEFAULT_POLL_INTERVAL_MS = 2_000;
const DEFAULT_POLL_TIMEOUT_MS = 30_000;

function isAmbiguousNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}

function extractDeclineMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "";
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useCardCheckoutPayment(
  options: UseCardCheckoutPaymentOptions
) {
  const [phase, setPhase] = useState<CardCheckoutPhase>("idle");
  const optionsRef = useRef(options);
  const generationRef = useRef(0);

  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    return () => {
      generationRef.current += 1;
    };
  }, []);

  const runPolling = async (generation: number): Promise<void> => {
    const pollIntervalMs =
      optionsRef.current.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const pollTimeoutMs =
      optionsRef.current.pollTimeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;
    const deadline = Date.now() + pollTimeoutMs;

    while (Date.now() < deadline) {
      await wait(pollIntervalMs);

      if (generationRef.current !== generation) {
        return;
      }

      const outcome = await optionsRef.current
        .pollStatus()
        .catch((): CardCheckoutPollOutcome => "unresolved");

      if (generationRef.current !== generation) {
        return;
      }

      if (outcome === "approved") {
        setPhase("idle");
        optionsRef.current.onApproved();
        return;
      }

      if (outcome === "declined") {
        setPhase("idle");
        optionsRef.current.onDeclined("declined", "");
        return;
      }
    }

    if (generationRef.current !== generation) {
      return;
    }

    setPhase("idle");
    optionsRef.current.onDeclined("unverified", "");
  };

  const submitCheckout = async (
    checkout: CardCheckoutFields
  ): Promise<void> => {
    const generation = ++generationRef.current;
    setPhase("submitting");

    try {
      const submitTimeoutMs =
        optionsRef.current.submitTimeoutMs ?? DEFAULT_SUBMIT_TIMEOUT_MS;

      await optionsRef.current.submit(
        checkout,
        AbortSignal.timeout(submitTimeoutMs)
      );

      if (generationRef.current !== generation) {
        return;
      }

      setPhase("idle");
      optionsRef.current.onApproved();
    } catch (error) {
      if (generationRef.current !== generation) {
        return;
      }

      if (isAmbiguousNetworkError(error)) {
        setPhase("verifying");
        await runPolling(generation);
        return;
      }

      setPhase("idle");
      optionsRef.current.onDeclined("declined", extractDeclineMessage(error));
      throw error;
    }
  };

  return { phase, submitCheckout };
}
