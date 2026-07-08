import { useTranslations } from "next-intl";
import { KitchenBoard } from "@/widgets/kitchen-board";

export function KitchenBoardPage() {
  const t = useTranslations("KitchenBoard");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("pageDescription")}
        </p>
      </header>

      <KitchenBoard />
    </div>
  );
}
