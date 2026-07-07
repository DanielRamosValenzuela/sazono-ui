import { setRequestLocale } from "next-intl/server";
import MenuStudioPage from "@/views/menu-studio";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocaleStaffMenuPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MenuStudioPage />;
}
