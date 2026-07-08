import { setRequestLocale } from "next-intl/server";
import SplitPaymentPage from "@/views/split-payment";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function LocaleSplitPage({
  params,
  searchParams,
}: LocalePageProps) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);

  return <SplitPaymentPage participantToken={token} />;
}
