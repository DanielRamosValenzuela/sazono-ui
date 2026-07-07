import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/widgets/admin-shell/ui/role-gate";
import { BranchesPanel } from "@/widgets/restaurant-dashboard/ui/branches-panel";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminBranchesPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <RoleGate allow="restaurantAdmin">
      <BranchesPanel />
    </RoleGate>
  );
}
