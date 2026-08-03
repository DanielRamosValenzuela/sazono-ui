import { setRequestLocale } from "next-intl/server";
import { TermsPage } from "@/views/terms";

type TerminosPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function TerminosPage({ params }: TerminosPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TermsPage />;
}
