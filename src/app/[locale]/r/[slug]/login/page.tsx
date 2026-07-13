import { setRequestLocale } from "next-intl/server";
import { RestaurantLogin } from "@/widgets/restaurant-login";

type RestaurantLoginPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export default async function RestaurantLoginPage({
  params,
}: RestaurantLoginPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return <RestaurantLogin slug={slug} />;
}
