import { setRequestLocale } from "next-intl/server";
import AdminWorkspacePage from "@/views/admin-workspace";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocaleAdminPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminWorkspacePage />;
}
