import { ApiError } from "@/shared/api/http-client";

export const DENOMINATIONS = [20000, 10000, 5000, 2000, 1000, 500, 100, 50, 10];

export function newIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function digitsOnly(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, 10);
}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError && error.message ? error.message : fallback;
}

export function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function sumDenominations(counts: Record<string, number>) {
  return Object.entries(counts).reduce(
    (total, [value, count]) => total + Number(value) * count,
    0,
  );
}
