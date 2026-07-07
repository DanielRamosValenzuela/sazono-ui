import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
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

  return <AdminShell>{children}</AdminShell>;
}
