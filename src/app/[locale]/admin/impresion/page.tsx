import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/widgets/admin-shell/ui/role-gate";
import { PrintingPanel } from "@/widgets/admin-printing/ui/printing-panel";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminPrintingPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <RoleGate allow="restaurantAdmin">
      <PrintingPanel />
    </RoleGate>
  );
}
