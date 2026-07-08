import { setRequestLocale } from "next-intl/server";
import KitchenBoardPage from "@/views/kitchen-board";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocaleStaffKitchenPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <KitchenBoardPage />;
}
