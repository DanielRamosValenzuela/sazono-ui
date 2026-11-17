import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/widgets/admin-shell/ui/role-gate";
import { ReportsPanel } from "@/widgets/reports";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminReportsPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <RoleGate allow="reports">
      <ReportsPanel />
    </RoleGate>
  );
}
