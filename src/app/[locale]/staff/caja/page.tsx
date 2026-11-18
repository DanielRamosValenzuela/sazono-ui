import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/widgets/admin-shell/ui/role-gate";
import { CashRegisterPanel } from "@/widgets/cash-register";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocaleStaffCashPage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <RoleGate allow="reports">
      <CashRegisterPanel />
    </RoleGate>
  );
}
