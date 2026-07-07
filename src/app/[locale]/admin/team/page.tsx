import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/widgets/admin-shell/ui/role-gate";
import { TeamPanel } from "@/widgets/restaurant-dashboard/ui/team-panel";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminTeamPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <RoleGate allow="restaurantAdmin">
      <TeamPanel />
    </RoleGate>
  );
}
