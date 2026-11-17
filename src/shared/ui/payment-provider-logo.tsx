import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PaymentGatewayProvider } from "@/shared/types/payments";

const LOGOS = {
  MERCADO_PAGO: { src: "/payments/mercado-pago.svg", width: 24, height: 24 },
  TRANSBANK: { src: "/payments/transbank.png", width: 1200, height: 195 },
} as const;

const HEIGHT_CLASS = {
  sm: "h-5",
  md: "h-7",
} as const;

type PaymentProviderLogoProps = {
  provider: PaymentGatewayProvider;
  size?: keyof typeof HEIGHT_CLASS;
  className?: string;
};

export function PaymentProviderLogo({
  provider,
  size = "md",
  className,
}: PaymentProviderLogoProps) {
  const logo = LOGOS[provider];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg bg-white px-2.5 py-1.5",
        className,
      )}
    >
      <Image
        src={logo.src}
        alt=""
        width={logo.width}
        height={logo.height}
        unoptimized
        className={cn("w-auto", HEIGHT_CLASS[size])}
      />
    </span>
  );
}
