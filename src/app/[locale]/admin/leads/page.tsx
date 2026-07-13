import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/widgets/admin-shell/ui/role-gate";
import { LeadsList } from "@/widgets/platform-dashboard/ui/leads-list";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminLeadsPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <RoleGate allow="platform">
      <LeadsList />
    </RoleGate>
  );
}
