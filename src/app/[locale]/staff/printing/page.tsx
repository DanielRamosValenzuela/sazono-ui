import { setRequestLocale } from "next-intl/server";
import PrintDevicePage from "@/views/print-device";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocaleStaffPrintingPage({
  params,
}: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PrintDevicePage />;
}
