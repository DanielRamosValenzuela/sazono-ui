import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/widgets/admin-shell/ui/role-gate";
import { TaxInvoicingPanel } from "@/widgets/tax-invoicing/ui/tax-invoicing-panel";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminInvoicingPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <RoleGate allow="restaurantAdmin">
      <TaxInvoicingPanel />
    </RoleGate>
  );
}
