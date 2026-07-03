import { setRequestLocale } from "next-intl/server";
import HomePage from "@/views/home";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocaleHomePage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomePage />;
}
