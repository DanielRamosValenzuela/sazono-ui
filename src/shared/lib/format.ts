/**
 * Locale "nativo" de cada moneda soportada, para que Intl elija el símbolo y
 * los separadores correctos (p. ej. "$3.500" en vez de "3500 CLP"). El
 * locale de la interfaz (es/en, sin región) no sirve para esto: sin región,
 * Intl no reconoce un símbolo local para monedas latinoamericanas.
 */
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
