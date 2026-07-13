import { setRequestLocale } from "next-intl/server";
import { FindRestaurant } from "@/widgets/find-restaurant";

type IngresarPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function IngresarPage({ params }: IngresarPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FindRestaurant />;
}
