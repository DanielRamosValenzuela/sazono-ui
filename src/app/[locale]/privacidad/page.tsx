import { setRequestLocale } from "next-intl/server";
import { PrivacyPage } from "@/views/privacy";

type PrivacidadPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PrivacidadPage({
  params,
}: PrivacidadPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivacyPage />;
}
