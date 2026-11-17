export const REPORT_TIME_ZONE = "America/Santiago";

export const RANGE_PRESETS = [
  "today",
  "yesterday",
  "last7",
  "thisMonth",
  "lastMonth",
  "custom",
] as const;

export type RangePreset = (typeof RANGE_PRESETS)[number];

export type DateRange = { from: string; to: string };

export function isRangePreset(value: string | null): value is RangePreset {
  return RANGE_PRESETS.some((preset) => preset === value);
}

export function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIME_ZONE,
  }).format(new Date());
}

export function addDays(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

export function resolveRange(
  preset: RangePreset,
  custom: Partial<DateRange>
): DateRange {
  const today = todayKey();

  switch (preset) {
    case "yesterday": {
      const yesterday = addDays(today, -1);
      return { from: yesterday, to: yesterday };
    }
    case "last7":
      return { from: addDays(today, -6), to: today };
    case "thisMonth":
      return { from: `${today.slice(0, 8)}01`, to: today };
    case "lastMonth": {
      const to = addDays(`${today.slice(0, 8)}01`, -1);
      return { from: `${to.slice(0, 8)}01`, to };
    }
    case "custom":
      return { from: custom.from || today, to: custom.to || today };
    default:
      return { from: today, to: today };
  }
}

export function formatReportDateTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: REPORT_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}
