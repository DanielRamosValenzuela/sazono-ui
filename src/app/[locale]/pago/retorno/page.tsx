import { setRequestLocale } from "next-intl/server";
import PaymentReturnPage from "@/views/payment-return";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    token_ws?: string;
    TBK_TOKEN?: string;
    TBK_ORDEN_COMPRA?: string;
    TBK_ID_SESION?: string;
  }>;
};

export default async function LocalePaymentReturnPage({
  params,
  searchParams,
}: LocalePageProps) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  return (
    <PaymentReturnPage
      tokenWs={query.token_ws}
      tbkToken={query.TBK_TOKEN}
      tbkOrdenCompra={query.TBK_ORDEN_COMPRA}
      tbkIdSesion={query.TBK_ID_SESION}
    />
  );
}
