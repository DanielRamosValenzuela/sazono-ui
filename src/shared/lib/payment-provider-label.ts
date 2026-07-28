import { assertNever } from "@/shared/lib/assert-never";
import type { PaymentGatewayProvider } from "@/shared/types/payments";

export function getPaymentProviderLabelKey(
  provider: PaymentGatewayProvider
): "MercadoPago" | "Transbank" {
  switch (provider) {
    case "MERCADO_PAGO":
      return "MercadoPago";
    case "TRANSBANK":
      return "Transbank";
    default:
      return assertNever(provider);
  }
}
