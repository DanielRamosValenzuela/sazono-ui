import { setRequestLocale } from "next-intl/server";
import { OverviewSwitch } from "@/widgets/admin-shell/ui/overview-switch";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocaleAdminPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <OverviewSwitch />;
}
