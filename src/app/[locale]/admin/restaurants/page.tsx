import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/widgets/admin-shell/ui/role-gate";
import { RestaurantsDirectory } from "@/widgets/platform-dashboard/ui/restaurants-directory";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminRestaurantsPage({
  params,
}: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <RoleGate allow="platform">
      <RestaurantsDirectory />
    </RoleGate>
  );
}
