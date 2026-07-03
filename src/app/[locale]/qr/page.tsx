import { setRequestLocale } from "next-intl/server";
import QrEntryPage from "@/views/qr-entry";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocaleQrPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <QrEntryPage />;
}
