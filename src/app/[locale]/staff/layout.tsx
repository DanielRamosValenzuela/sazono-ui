import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { PrintClientRunner } from "@/features/print-client/ui/print-client-runner";
import { AdminShell } from "@/widgets/admin-shell";

type StaffLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function StaffLayout({
  children,
  params,
}: StaffLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PrintClientRunner />
      <AdminShell area="staff">{children}</AdminShell>
    </>
  );
}
