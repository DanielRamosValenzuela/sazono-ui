import { setRequestLocale } from "next-intl/server";
import QrEntryPage from "@/views/qr-entry";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    table?: string;
  }>;
};

export default async function LocaleQrPage({
  params,
  searchParams,
}: LocalePageProps) {
  const { locale } = await params;
  const { table } = await searchParams;
  setRequestLocale(locale);

  return <QrEntryPage qrToken={table} />;
}
