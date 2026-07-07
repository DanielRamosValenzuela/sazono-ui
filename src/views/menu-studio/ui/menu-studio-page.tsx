import { useTranslations } from "next-intl";
import { MenuStudio } from "@/widgets/menu-studio";

export function MenuStudioPage() {
  const t = useTranslations("MenuStudioPage");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
      </header>

      <MenuStudio />
    </div>
  );
}
