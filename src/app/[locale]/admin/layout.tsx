import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { AdminShell } from "@/widgets/admin-shell";

type AdminLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminShell area="platform">{children}</AdminShell>;
}
