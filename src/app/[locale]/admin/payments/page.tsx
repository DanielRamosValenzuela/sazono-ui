import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/widgets/admin-shell/ui/role-gate";
import { PaymentsPanel } from "@/widgets/restaurant-dashboard/ui/payments-panel";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminPaymentsPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <RoleGate allow="restaurantAdmin">
      <PaymentsPanel />
    </RoleGate>
  );
}
