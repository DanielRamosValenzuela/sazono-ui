export function formatPercent(value: number, locale: string, signed = false) {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 2,
    signDisplay: signed ? "exceptZero" : "auto",
  }).format(value / 100);
}

export function formatDecimal(value: string | number, locale: string) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatDateKey(key: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    dateStyle: "short",
  }).format(new Date(`${key}T00:00:00Z`));
}

export function negativeClass(value: string | number) {
  return Number(value) < 0 ? "text-destructive" : undefined;
}
