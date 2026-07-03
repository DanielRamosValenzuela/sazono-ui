import { setRequestLocale } from "next-intl/server";
import StaffDashboardPage from "@/views/staff-dashboard";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocaleStaffPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <StaffDashboardPage />;
}
