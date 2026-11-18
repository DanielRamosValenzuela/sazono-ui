import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/widgets/admin-shell/ui/role-gate";
import { MonthlyStatements } from "@/widgets/platform-dashboard/ui/monthly-statements";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminBillingPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <RoleGate allow="platform">
      <MonthlyStatements />
    </RoleGate>
  );
}
