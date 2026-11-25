"use client";

import { useTranslations } from "next-intl";

export const PRINT_ERROR_CODES = [
  "MANUAL_RETRY",
  "OUT_OF_PAPER",
  "PRINT_ERROR",
  "REFUSED",
  "ECONNREFUSED",
  "TIMEOUT",
  "ETIMEDOUT",
  "UNREACHABLE",
  "EHOSTUNREACH",
  "TCP_DNS",
  "TCP_HOST_FORBIDDEN",
  "TCP_PORT_FORBIDDEN",
  "TCP_BAD_CONNECTION",
  "TCP_CONNECT_TIMEOUT",
  "TCP_WRITE_TIMEOUT",
  "TCP_CLOSED",
  "TCP_ABORTED",
  "TCP_ERROR",
  "NO_TRANSPORT",
  "INVALID_CONNECTION",
  "INVALID_DOCUMENT",
  "LEASE_EXPIRED",
  "PRINT_TIMEOUT",
  "NO_HTML",
  "NO_FRAME",
  "PRINTER_UNKNOWN",
  "NO_PRINTER",
  "IO_ERROR",
  "BT_UNAVAILABLE",
  "BT_DEVICE_NOT_FOUND",
  "BT_PERMISSION_DENIED",
  "BT_CONNECT_FAILED",
  "PAYLOAD_TOO_LARGE",
  "INVALID_ARGUMENT",
  "TICKET_NOT_PENDING",
] as const;

const GENERIC = ["MANUAL_RETRY", "PRINT_ERROR"];

export function usePrintErrorText() {
  const t = useTranslations("PrintErrors");

  return (raw: string | null | undefined): string => {
    if (!raw) {
      return "";
    }

    const tokens = raw.match(/[A-Z][A-Z0-9_]{2,}/g) ?? [];
    const known = tokens.filter((token) =>
      (PRINT_ERROR_CODES as readonly string[]).includes(token)
    );
    const manual = known.includes("MANUAL_RETRY");
    const main =
      known.find((code) => !GENERIC.includes(code)) ??
      (known.includes("PRINT_ERROR") ? "PRINT_ERROR" : null);

    if (!main) {
      if (!manual) {
        return raw;
      }

      const rest = raw.replace("MANUAL_RETRY", "").trim();

      return rest ? `${t("MANUAL_RETRY")} - ${rest}` : t("MANUAL_RETRY");
    }

    const text = t(main as (typeof PRINT_ERROR_CODES)[number]);

    return manual ? `${t("MANUAL_RETRY")} - ${text}` : text;
  };
}
