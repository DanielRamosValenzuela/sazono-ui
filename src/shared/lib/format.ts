const CURRENCY_LOCALES: Record<string, string> = {
  CLP: "es-CL",
  USD: "en-US",
  EUR: "de-DE",
  MXN: "es-MX",
  COP: "es-CO",
  PEN: "es-PE",
  ARS: "es-AR",
  UYU: "es-UY",
};

export function formatMoney(
  amount: string | number,
  currency = "CLP",
  locale?: string
) {
  const resolvedLocale = locale ?? CURRENCY_LOCALES[currency] ?? "es-CL";

  return new Intl.NumberFormat(resolvedLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}
