import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/widgets/admin-shell/ui/role-gate";
import { RestaurantDetail } from "@/widgets/platform-dashboard/ui/restaurant-detail";

type LocalePageProps = {
  params: Promise<{
    locale: string;
    restaurantId: string;
  }>;
};

export default async function AdminRestaurantDetailPage({
  params,
}: LocalePageProps) {
  const { locale, restaurantId } = await params;
  setRequestLocale(locale);

  return (
    <RoleGate allow="platform">
      <RestaurantDetail restaurantId={restaurantId} />
    </RoleGate>
  );
}
