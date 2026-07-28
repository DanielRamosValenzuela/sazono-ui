import { PaymentReturn } from "@/widgets/payment-return/ui/payment-return";

type PaymentReturnPageProps = {
  tokenWs?: string;
  tbkToken?: string;
  tbkOrdenCompra?: string;
  tbkIdSesion?: string;
};

export function PaymentReturnPage({
  tokenWs,
  tbkToken,
  tbkOrdenCompra,
  tbkIdSesion,
}: PaymentReturnPageProps) {
  return (
    <PaymentReturn
      tokenWs={tokenWs}
      tbkToken={tbkToken}
      tbkOrdenCompra={tbkOrdenCompra}
      tbkIdSesion={tbkIdSesion}
    />
  );
}
